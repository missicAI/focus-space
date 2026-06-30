use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize)]
struct ActiveWindowInfo {
    process_name: String,
    title: String,
    pid: u32,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct WarningPayload {
    subject: String,
    message: String,
    detail: String,
    remaining_seconds: i32,
    grace_seconds: i32,
    lock_mode: String,
}

#[tauri::command]
fn get_active_window() -> ActiveWindowInfo {
    platform::get_active_window()
}

#[tauri::command]
fn minimize_active_window() -> bool {
    platform::minimize_active_window()
}

#[tauri::command]
fn show_warning_window(app: tauri::AppHandle, payload: WarningPayload) -> Result<(), String> {
    let _ = payload;
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    window.show().map_err(|err| err.to_string())?;
    window.set_fullscreen(true).map_err(|err| err.to_string())?;
    window.set_always_on_top(true).map_err(|err| err.to_string())?;
    window.set_focus().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_warning_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_fullscreen(false).map_err(|err| err.to_string())?;
        window.set_always_on_top(false).map_err(|err| err.to_string())?;
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_active_window,
            minimize_active_window,
            show_warning_window,
            hide_warning_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running Focus Space");
}

#[cfg(not(windows))]
mod platform {
    use super::ActiveWindowInfo;

    pub fn get_active_window() -> ActiveWindowInfo {
        ActiveWindowInfo {
            process_name: "non-windows-preview".to_string(),
            title: "Preview mode outside Windows".to_string(),
            pid: 0,
        }
    }

    pub fn minimize_active_window() -> bool {
        false
    }

}

#[cfg(windows)]
mod platform {
    use super::ActiveWindowInfo;
    use std::path::Path;
    use windows::core::PWSTR;
    use windows::Win32::Foundation::{CloseHandle, HWND};
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
        ShowWindow, SW_MINIMIZE,
    };

    pub fn get_active_window() -> ActiveWindowInfo {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return empty();
            }

            let title = read_title(hwnd);
            let mut pid = 0u32;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            let process_name = process_name_from_pid(pid);

            ActiveWindowInfo {
                process_name,
                title,
                pid,
            }
        }
    }

    pub fn minimize_active_window() -> bool {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return false;
            }
            ShowWindow(hwnd, SW_MINIMIZE).as_bool()
        }
    }

    fn empty() -> ActiveWindowInfo {
        ActiveWindowInfo {
            process_name: String::new(),
            title: String::new(),
            pid: 0,
        }
    }

    unsafe fn read_title(hwnd: HWND) -> String {
        let len = GetWindowTextLengthW(hwnd);
        if len <= 0 {
            return String::new();
        }

        let mut buffer = vec![0u16; (len + 1) as usize];
        let copied = GetWindowTextW(hwnd, &mut buffer);
        String::from_utf16_lossy(&buffer[..copied as usize])
    }

    unsafe fn process_name_from_pid(pid: u32) -> String {
        if pid == 0 {
            return String::new();
        }

        let handle = match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
            Ok(handle) => handle,
            Err(_) => return format!("pid-{pid}"),
        };

        let mut buffer = vec![0u16; 32768];
        let mut size = buffer.len() as u32;
        let ok = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_FORMAT(0),
            PWSTR(buffer.as_mut_ptr()),
            &mut size,
        );
        let _ = CloseHandle(handle);

        if ok.is_err() || size == 0 {
            return format!("pid-{pid}");
        }

        let path = String::from_utf16_lossy(&buffer[..size as usize]);
        Path::new(&path)
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or(&path)
            .to_string()
    }

}
