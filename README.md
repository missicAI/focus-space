# Focus Space

Focus Space là bản nâng cấp theo hướng `Study Room`: mỗi môn học có một vùng học riêng gồm app/link được phép, app bị chặn, mục tiêu, timer, cảnh báo và thống kê.

## 1. Cần cài gì?

Cài 3 thứ này trên Windows:

1. Node.js LTS: https://nodejs.org
2. Rust: https://rustup.rs
3. Microsoft Edge WebView2 Runtime. Máy Windows 10/11 thường đã có sẵn.

Sau khi cài Rust, đóng VS Code/Cursor rồi mở lại để terminal nhận lệnh `cargo`.

Kiểm tra trong terminal:

```powershell
node --version
npm --version
cargo --version
```

Nếu cả 3 lệnh đều hiện phiên bản là được.

## 2. Cách chạy app

Mở terminal tại thư mục này:

```powershell
cd focus_space_tauri
npm install
npm run app
```

Hoặc double click:

```text
run_dev.bat
```

Nếu bạn lỡ chạy thẳng `npm run app` và thấy lỗi:

```text
'tauri' is not recognized as an internal or external command
```

thì nghĩa là project chưa cài package. Chạy:

```powershell
npm install
npm run app
```

Bản này đã thêm bước tự kiểm tra dependency, nên sau khi cập nhật code, `npm run app` cũng sẽ tự chạy `npm install` khi thiếu Tauri CLI.

Lần đầu chạy sẽ hơi lâu vì tải package và build Rust.

## 3. Cách build ra file exe

Chạy:

```powershell
npm run dist
```

Hoặc double click:

```text
build_installer.bat
```

File cài đặt hoặc file `.exe` sẽ nằm trong:

```text
src-tauri\target\release\bundle
```

## 3.1. Tạo lối mở nhanh ngoài Desktop

Sau khi app build được, double click:

```text
create_desktop_shortcut.bat
```

File này sẽ tạo shortcut `Focus Space` ngoài Desktop.

## 3.2. Tạo bản để người khác tải

Double click:

```text
build_release_for_users.bat
```

Sau khi chạy xong, file để gửi cho người khác nằm ở:

```text
release\FocusSpace-Windows-Beta
```

Bạn có thể upload các file trong thư mục đó lên Google Drive, GitHub Releases, hoặc website riêng.

## 4. Cách dùng nhanh

1. Chọn môn ở cột trái.
2. Sửa mục tiêu buổi học.
3. Mở app/tab học thật.
4. Bấm `Thêm app/tab đang mở sau 5s`.
5. Trong 5 giây, chuyển sang app/tab học đó.
6. Muốn chặn app nào thì bấm `Chặn app đang mở sau 5s`, rồi chuyển sang app đó.
7. Bấm `Bắt đầu học`.

## 5. Mức khóa

- `Normal`: chỉ cảnh báo.
- `Strict`: cảnh báo, ghi mất tập trung, app bị chặn sẽ bị thu nhỏ.
- `Locked`: giao diện cảnh báo nghiêm hơn. Bản sau có thể nâng cấp thành overlay always-on-top riêng.

## 6. Về chụp màn hình

Các công cụ chụp màn hình như Snipping Tool, ShareX, Greenshot được tính là trung lập. Khi bạn chụp màn hình, app sẽ không cảnh báo và cũng không cộng giờ học.

## 7. Hiện tại app làm được gì?

- Tạo nhiều môn học.
- Mỗi môn có vùng học riêng.
- Lưu app học, link/keyword học, app bị chặn.
- Cảnh báo đẹp khi rời vùng học.
- Cảnh báo bằng cửa sổ overlay riêng, luôn nổi lên trên app khác.
- Có thời gian tha thứ trước khi tính vi phạm.
- Có nút nghỉ giải lao.
- Có task buổi học.
- Có thống kê học sâu, nghỉ, mất tập trung, số lần rời vùng.
- Lưu dữ liệu local bằng `localStorage`.
- Backend Rust đọc cửa sổ đang active trên Windows.

## 8. Nâng cấp nên làm sau

Các phần này chưa làm trong MVP:

- SQLite thay cho `localStorage`.
- Browser extension để đọc URL tab chính xác.
- Lịch học tự bật focus mode.
- Locked mode cấp hệ thống.
- Đồng bộ dữ liệu nhiều máy.
- Installer có icon đẹp và auto update.

## 9. Khi bị lỗi thường gặp

Nếu báo không có `cargo`:

```text
cargo is not recognized
```

Bạn cần cài Rust ở https://rustup.rs, rồi mở lại terminal.

Nếu báo thiếu WebView2, hãy cài Microsoft Edge WebView2 Runtime.

Nếu `npm install` lỗi mạng, chạy lại lệnh đó lần nữa.
