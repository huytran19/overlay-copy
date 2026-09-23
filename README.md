# Overlay Copy

Overlay nhỏ, luôn nổi trên cùng, giúp copy lần lượt từng dòng mà không bị lạc chỗ.

## Chạy thử (macOS / Windows / Linux)

```bash
npm install
```

```bash
npm start
```

## Build file `.exe` cho Windows

```bash
npm run build:win
```

Kết quả nằm trong thư mục `dist/`:

- `OverlayCopy-portable.exe` — chạy trực tiếp, không cần cài đặt
- `OverlayCopy-setup.exe` — bản cài đặt (chọn được thư mục)

> Build từ macOS/Linux cần **Wine**. Nếu không có Wine, hãy chạy lệnh trên từ một máy Windows,
> hoặc dùng GitHub Actions với `runs-on: windows-latest`.

## Cách dùng

1. Dán nội dung vào ô nhập. Mỗi **từ** (cách nhau bằng dấu cách hoặc xuống dòng) thành 1 dòng.
   Tick **"Chỉ tách theo dòng"** nếu muốn giữ nguyên cụm nhiều từ trên cùng một dòng.
2. Bấm **RUN** → danh sách hiện ra, đánh số 1 → n.
3. Bấm **Copy** ở dòng nào thì nội dung dòng đó vào clipboard:
   - Dòng vừa copy: mờ 60%
   - Các dòng copy trước đó: mờ 90%
   - Dòng kế tiếp: sáng lên, viền xanh
4. Copy hết → hiện **DONE ✓**

## Chế độ xuyên chuột (dùng khi overlay che game)

Bấm nút **👆** trên thanh tiêu đề → chuyển thành **👻**: mọi cú nhấp chuột đi thẳng xuống
cửa sổ bên dưới, overlay chỉ còn để nhìn. Viền cam quanh cửa sổ báo đang bật.

Lúc này **không bấm được nút nào trong app nữa**, nên phải dùng phím tắt toàn cục:

| Phím tắt toàn cục | Tác dụng | Hoạt động khi |
|---|---|---|
| `Ctrl + Alt + Space` | Bật/tắt xuyên chuột | Mọi lúc, kể cả app không được focus |
| `Ctrl + Alt + C` | Copy dòng kế tiếp | Mọi lúc, kể cả đang trong game |

## Cài đặt nâng cao (nút ⚙️)

Bấm nút **⚙️** trên thanh tiêu đề để mở bảng cài đặt.

### Gán tổ hợp phím

Năm chức năng gán được phím tắt toàn cục:

| Chức năng | Mặc định |
|---|---|
| Copy dòng kế tiếp | `Ctrl + Alt + C` |
| Bật / tắt xuyên chuột | `Ctrl + Alt + Space` |
| Hoàn tác lần copy gần nhất | chưa gán |
| Làm lại từ đầu | chưa gán |
| Ẩn / hiện overlay | chưa gán |
| Dừng macro khẩn cấp | `Escape` (chỉ sống khi macro chạy) |

Ba cách gán:

- **Bấm vào ô phím** rồi gõ tổ hợp — nhận `Ctrl + F`, `Alt + Shift + F9`, phím numpad,
  phím mũi tên, hoặc chỉ một phím như `;`. `Esc` để huỷ.
- **Nút ✎** — tự gõ tổ hợp dạng chữ (`ctrl + shift + f9`), Enter để áp dụng.
- **Nút ✕** — bỏ gán, tắt hẳn phím tắt đó.

App từ chối nếu hai chức năng trùng phím, hoặc nếu tổ hợp đang bị app khác giữ — và tự
quay về phím cũ thay vì để bạn mất phím tắt.

> Gán **một phím đơn** (ví dụ `;`) thì app sẽ giữ phím đó trên **toàn hệ thống** — khi app
> đang chạy bạn sẽ không gõ được ký tự đó ở bất kỳ chỗ nào khác. Tiện khi chơi game nhưng
> nhớ tắt app khi cần gõ văn bản.

### Ngôn ngữ

Bảng cài đặt có công tắc **Tiếng Việt / English** ngay trên cùng, đổi là toàn bộ giao diện
đổi theo ngay. Mặc định là tiếng Việt. Chuỗi ngôn ngữ nằm trong `renderer/i18n.js` —
thêm ngôn ngữ mới chỉ cần thêm một khối vào đó và một mã vào mảng `LANGS`.

### Tuỳ chọn

- **Nhớ độ trong suốt** — mở lần sau vẫn giữ mức đã kéo
- **Nhớ vị trí và kích thước cửa sổ** — tự kéo về trong màn hình nếu đổi độ phân giải
- **Mặc định chỉ tách theo dòng** — khỏi phải tích lại ô đó mỗi lần mở

Tất cả ghi vào `config.json` trong thư mục dữ liệu của app.

## Macro tự động (nút 🎬)

Ghi lại một lượt thao tác rồi cho app tự làm lại cho từng dòng.

1. Bấm **RUN** để có danh sách dòng.
2. Bấm 🎬 → **⏺ Ghi thao tác** → sang game làm **đúng một lượt**: nhấp vào ô nhập,
   `Ctrl+V`, nhấp nút xác nhận.
3. **⏹ Dừng ghi**. Mọi cú nhấp/phím bên ngoài cửa sổ overlay đã thành danh sách bước.
   Khi bạn bấm `Ctrl+V`, app tự chèn bước **"Lấy code kế tiếp"** ngay trước đó.
4. Chỉnh lại bằng ↑ ↓ ✕, thêm bước *Chờ* nếu game load chậm. Ghi là **nối tiếp** vào
   danh sách đang có, không xoá bước cũ — muốn làm lại thì bấm *Xoá hết* trước.
   Nếu lúc ghi không bắt được `Ctrl+V` thì bấm **+ Dán code (2 bước)** để thêm tay.
5. **▶ Chạy N vòng** → đếm ngược 3 giây → mỗi vòng dán một dòng và tự đánh dấu đã copy.

Phím **dừng khẩn cấp** (mặc định `Escape`) chỉ được đăng ký trong lúc macro chạy, nên
không chiếm phím khi app rảnh. Đổi được ở bảng ⚙️.

### Giới hạn cần biết

- Cần 2 native module (`uiohook-napi`, `@jitsi/robotjs`). Cả hai có prebuild sẵn cho
  `win32-x64` nên `npm install` là chạy, không cần `node-gyp`.
- **Nhiều game đọc RawInput/DirectInput nên bỏ qua chuột/phím giả lập**, và anti-cheat có
  thể chặn hoặc đánh dấu. Thử vài dòng trước khi chạy cả danh sách.
- Trên macOS phải cấp quyền **System Settings → Privacy & Security → Accessibility**,
  nếu không sẽ không ghi và không bấm được.
- Toạ độ ghi theo pixel màn hình. Đổi độ phân giải hoặc di chuyển cửa sổ game thì phải ghi lại.

## Phím tắt trong app (cần app đang được focus)

| Phím | Tác dụng |
|---|---|
| `Ctrl/Cmd + Enter` | Chạy (khi đang ở ô nhập) |
| `Enter` hoặc `Space` | Copy dòng đang sáng, tự nhảy dòng kế tiếp |
| `Ctrl/Cmd + Z` | Hoàn tác lần copy gần nhất |
| `Esc` | Quay lại ô nhập |

## Điều khiển cửa sổ

- Kéo thanh tiêu đề để di chuyển
- Kéo cạnh / góc cửa sổ để đổi kích thước (nhỏ nhất 300×220)
- Thanh trượt: chỉnh độ trong suốt của cả cửa sổ (30–100%)
- 👆 / 👻 : bật/tắt xuyên chuột
- 📌 : bật/tắt chế độ luôn nổi trên cùng

## Cấu trúc

```
main.js              Tiến trình chính: cửa sổ, clipboard, always-on-top, phím tắt
macro.js             Ghi và phát lại thao tác (uiohook-napi + @jitsi/robotjs)
preload.js           Cầu nối an toàn (contextIsolation) giữa main và giao diện
renderer/index.html  Bố cục
renderer/styles.css  Giao diện + các mức mờ (0.4 / 0.1)
renderer/i18n.js     Chuỗi tiếng Việt / tiếng Anh
renderer/renderer.js Logic tách dòng, trạng thái copy, DONE, cài đặt
```
