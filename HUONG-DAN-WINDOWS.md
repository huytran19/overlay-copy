# Hướng dẫn cài Overlay Copy trên Windows

**Máy cần có:** Windows 10 hoặc Windows 11, bản 64-bit.
**Máy KHÔNG cần cài thêm:** Node.js, .NET, Visual C++ — không cần gì cả.
**Số file phải gửi sang:** đúng 1 file.

---

# PHẦN A — Chép file sang máy Windows

## Bước 1. Chọn file cần gửi

Vào thư mục `dist/`, chọn **1 trong 2 file** dưới đây (chỉ 1, không phải cả hai):

| File | Dùng khi nào |
|---|---|
| **`OverlayCopy-portable-1.0.0.exe`** | Chạy thẳng, không cài đặt. Để trong USB, cắm máy nào chạy máy đó. → **Nên chọn cái này** |
| `OverlayCopy-setup-1.0.0.exe` | Muốn cài hẳn vào máy, có sẵn shortcut ngoài Desktop và trong Start Menu |

Các file còn lại trong `dist/` (`win-unpacked/`, `.blockmap`, `builder-debug.yml`) **không cần gửi**.

## Bước 2. Chép file qua máy Windows

Chọn 1 trong các cách:

- **USB** — kéo thả file vào USB, cắm sang máy Windows, chép ra Desktop
- **Google Drive / OneDrive / Dropbox** — tải file lên, mở link trên máy Windows rồi tải về
- **Zalo PC / Telegram** — gửi cho chính mình rồi tải về ở máy kia

⚠️ **Không gửi qua Gmail** — Google chặn mọi file đuôi `.exe`.
Nếu bắt buộc phải dùng email: nén file thành `.zip` **có đặt mật khẩu** rồi mới gửi.

## Bước 3. Kiểm tra file có bị lỗi khi truyền không (nên làm)

Trên máy Windows, mở thư mục chứa file, gõ `powershell` vào thanh địa chỉ rồi Enter. Dán lệnh sau:

```powershell
Get-FileHash .\OverlayCopy-portable-1.0.0.exe -Algorithm SHA256
```

Dãy ký tự hiện ra phải **khớp đúng** với dãy dưới đây:

```
Bản portable : 10460979604604D31F68743F4963D87EA5CF0FE1525FDC1E2FE7975BBE637EB2
Bản setup    : 4EB9488675288FD9CF254E8C65B3C65B8085350135695538178810A474DF83DA
```

- **Khớp** → file nguyên vẹn, đi tiếp Phần B
- **Không khớp** → file hỏng lúc truyền, chép lại từ đầu

---

# PHẦN B — Chạy lần đầu trên Windows

## Bước 4. Bỏ khoá file (làm trước cho đỡ vướng)

File tải từ Internet về hay bị Windows đánh dấu "không tin cậy". Bỏ dấu này trước:

1. **Chuột phải** vào file `.exe`
2. Chọn **Properties**
3. Nhìn xuống **cuối cùng** của thẻ *General*, nếu thấy ô **Unblock** thì **tích vào**
4. Bấm **OK**

Không thấy ô *Unblock* cũng bình thường — bỏ qua, đi tiếp.

## Bước 5. Nháy đúp vào file

Nháy đúp chuột vào `OverlayCopy-portable-1.0.0.exe`.

## Bước 6. Vượt qua màn hình xanh SmartScreen

Vì file **chưa mua chữ ký số**, Windows sẽ hiện màn hình xanh:

> **Windows protected your PC**
> Microsoft Defender SmartScreen prevented an unrecognized app from starting.

Làm theo đúng 2 bước:

1. Bấm vào dòng chữ nhỏ **More info** (nằm dưới đoạn chữ, dễ bị bỏ sót)
2. Bấm nút **Run anyway** vừa hiện ra

✅ Chỉ bị hỏi **duy nhất lần đầu**. Từ lần thứ hai trở đi nháy đúp là chạy thẳng.

## Bước 7. Chờ app mở lên

Lần đầu chờ khoảng **5–10 giây** (app tự giải nén). Các lần sau nhanh hơn nhiều.

Cửa sổ sẽ hiện ra ở **góc trên bên phải** màn hình.

## Bước 8. Tạo shortcut cho tiện (không bắt buộc)

Chuột phải vào file `.exe` → **Send to** → **Desktop (create shortcut)**.

---

# PHẦN B' — Nếu bạn chọn bản Setup thay vì Portable

Thay Bước 5–8 ở trên bằng các bước sau:

1. Nháy đúp `OverlayCopy-setup-1.0.0.exe`
2. Vượt màn hình xanh SmartScreen y như **Bước 6**
3. Chọn thư mục cài — cứ để mặc định là được:
   `C:\Users\<tên bạn>\AppData\Local\Programs\overlay-copy`
4. Bấm **Install**
5. Bấm **Finish** → app tự mở lên

Cài cho riêng tài khoản đang đăng nhập nên **không hỏi mật khẩu Administrator**.

---

# PHẦN C — Cách sử dụng

## Bước 9. Nhập nội dung

Dán hoặc gõ nội dung vào ô lớn ở giữa.

- **Mặc định:** mỗi **từ** (cách nhau bằng dấu cách hoặc xuống dòng) thành 1 dòng riêng
- **Tích ô "Chỉ tách theo dòng":** giữ nguyên cụm nhiều từ, mỗi dòng bạn xuống hàng mới thành 1 mục

Góc phải dưới ô nhập hiện số mục đang đếm được, ví dụ `100 muc`.

## Bước 10. Bấm RUN

Danh sách hiện ra, đánh số **1, 2, 3…** từ trên xuống.

## Bước 11. Copy từng dòng

Bấm nút **Copy** bên phải mỗi dòng. Sau mỗi lần bấm:

- Dòng vừa copy → **mờ 60%**
- Các dòng đã copy trước đó → **mờ 90%**
- Dòng kế tiếp → **sáng lên, viền xanh** (dòng bạn cần làm tiếp theo)

Thanh tiến độ trên đầu hiện `3 / 100`.

## Bước 12. Hoàn tất

Khi copy hết tất cả các dòng, app hiện khung xanh **DONE ✓**.

---

# PHẦN D — Dùng chung với game (chế độ xuyên chuột)

Khi overlay nằm đè lên game, mỗi lần bạn nhấp chuột vào vùng overlay là game **không nhận được** cú nhấp đó. Chế độ xuyên chuột giải quyết việc này.

## Bước 13. Bật xuyên chuột

Bấm nút **👆** trên thanh tiêu đề. Nút đổi thành **👻**, quanh cửa sổ hiện **viền cam**, và có dòng cảnh báo màu cam ở đáy.

Từ lúc này mọi cú nhấp chuột **đi thẳng xuống game**, overlay chỉ còn để nhìn.

## Bước 14. Điều khiển bằng phím tắt toàn cục

Đang bật xuyên chuột thì **không bấm được nút nào trong app nữa** (kể cả nút tắt). Dùng 2 phím tắt sau — chúng chạy được **kể cả khi bạn đang ở trong game**:

| Phím tắt | Tác dụng |
|---|---|
| **`Ctrl + Alt + Space`** | Bật / tắt xuyên chuột |
| **`Ctrl + Alt + C`** | Copy dòng kế tiếp (dòng đang sáng) |

Cách chơi thực tế: bật 👻 → nhìn overlay để biết dòng nào tới lượt → bấm `Ctrl + Alt + C` → dán vào game bằng `Ctrl + V` → overlay tự mờ dòng vừa copy và sáng dòng kế tiếp.

## Bước 15. Tắt xuyên chuột

Bấm `Ctrl + Alt + Space`. Viền cam biến mất, bấm nút lại được bình thường.

## Bước 16. Cài đặt nâng cao — gán tổ hợp phím theo ý bạn

Thấy `Ctrl + Alt + C` khó bấm, hoặc game của bạn đã dùng sẵn tổ hợp đó? Bấm nút **⚙️** trên thanh tiêu đề (cạnh nút 👆) để mở bảng **Cài đặt nâng cao**.

### Năm chức năng gán được phím tắt

| Chức năng | Mặc định |
|---|---|
| **Copy dòng kế tiếp** | `Ctrl + Alt + C` |
| **Bật / tắt xuyên chuột** | `Ctrl + Alt + Space` |
| **Hoàn tác lần copy gần nhất** | chưa gán |
| **Làm lại từ đầu** | chưa gán |
| **Ẩn / hiện overlay** | chưa gán |
| **Dừng macro khẩn cấp** | `Escape` — chỉ sống trong lúc macro chạy |

Ba chức năng dưới mặc định để trống — gán thêm nếu bạn thấy cần. Riêng **Ẩn / hiện overlay** rất đáng gán: giấu cửa sổ đi lúc cần nhìn toàn màn hình rồi gọi lại, và lúc hiện lại nó **không cướp focus** khỏi game.

### Ba cách gán

1. **Bấm vào ô phím** → ô nhấp nháy và hiện *Gõ phím...* → **gõ tổ hợp bạn muốn**. Nhận `Ctrl + F`, `Alt + Shift + F9`, phím mũi tên, phím numpad, hoặc chỉ một phím `;`. `Esc` để huỷ.
2. **Bấm nút ✎** → tự gõ tổ hợp dạng chữ, ví dụ `ctrl + shift + f9`, rồi Enter.
3. **Bấm nút ✕** → bỏ gán, tắt hẳn phím tắt đó.

App áp dụng ngay và nhớ luôn cho những lần mở sau.

### Đổi ngôn ngữ

Ngay trên cùng bảng cài đặt có công tắc **Tiếng Việt / English**. Bấm là đổi ngay toàn bộ giao diện, và app nhớ lựa chọn cho lần mở sau. Đổi ngôn ngữ **không ảnh hưởng gì tới phím tắt** bạn đã gán.

### Tuỳ chọn

- **Nhớ độ trong suốt** — mở lần sau vẫn giữ mức trong suốt đã kéo
- **Nhớ vị trí và kích thước cửa sổ** — mở lại đúng chỗ cũ, và tự kéo về trong màn hình nếu bạn vừa đổi độ phân giải
- **Mặc định chỉ tách theo dòng** — khỏi phải tích lại ô đó mỗi lần mở

Hai nút dưới cùng trả phím tắt / tuỳ chọn về mặc định.

⚠️ **Nếu gán một phím đơn** (như `;` hay `F8`) thì app giữ phím đó trên **toàn máy**: lúc app đang chạy, bạn gõ `;` ở Word hay trình duyệt cũng sẽ không ra ký tự. Rất tiện khi chơi game, nhưng nhớ tắt app khi cần gõ văn bản. App có hiện cảnh báo vàng khi bạn chọn phím đơn.

⚠️ **Nếu tổ hợp bị app khác giữ, hoặc trùng với chức năng khác**, app báo đỏ và **tự quay về phím cũ** — bạn không bị mất phím tắt. Chọn tổ hợp khác là được.

---

# PHẦN D' — Macro tự động (nút 🎬)

Thay vì tự bấm `Ctrl+Alt+C` → `Ctrl+V` → Enter cho từng dòng, bạn dạy app làm **một lượt** rồi nó tự lặp lại cho cả danh sách.

## Bước 17. Ghi một lượt thao tác

1. Nhập nội dung và bấm **RUN** như bình thường.
2. Bấm nút **🎬** trên thanh tiêu đề.
3. Bấm **⏺ Ghi thao tác** — nút chuyển sang màu đỏ.
4. **Sang cửa sổ game và làm đúng một lượt**: nhấp vào ô nhập code → `Ctrl + V` → nhấp nút xác nhận.
5. Quay lại bấm **⏹ Dừng ghi**.

Mọi cú nhấp và phím bạn bấm **bên ngoài** cửa sổ overlay đều được ghi thành danh sách bước. Nhấp vào chính cửa sổ overlay thì không bị ghi, nên bạn bấm nút Dừng ghi thoải mái.

💡 Khi bạn bấm `Ctrl + V`, app **tự chèn bước "Lấy code kế tiếp"** ngay trước đó — đây là bước khiến mỗi vòng dán một code khác nhau.

💡 **Ghi là nối tiếp, không xoá.** Bạn có thể tự xếp vài bước trước rồi bấm Ghi để thêm phần còn lại. Muốn làm lại từ đầu thì bấm **🗑 Xoá hết** trước.

💡 Nếu lúc ghi app **không bắt được `Ctrl+V`** (một số bàn phím / trình điều khiển không báo phím bổ trợ cho hook), cứ bấm nút **+ Dán code (2 bước)** rồi dùng ↑ ↓ kéo cặp đó vào đúng chỗ.

## Bước 18. Chỉnh lại danh sách bước

| Nút | Tác dụng |
|---|---|
| **↑ ↓** | Đổi thứ tự bước |
| **✕** | Xoá bước đó |
| **+ Dán code (2 bước)** | Thêm luôn cặp *Lấy code kế tiếp* + *Ctrl+V* — dùng khi lúc ghi app không bắt được phím dán |
| **+ Lấy code kế tiếp** | Chỉ thêm bước lấy code |
| **+ Chờ 500ms** | Thêm khoảng nghỉ, dùng khi game load chậm |
| **🗑 Xoá hết** | Làm lại từ đầu |

Ô **Nghỉ giữa các vòng** là thời gian chờ giữa hai code, mặc định 400ms. Game chậm thì tăng lên 800–1500ms.

## Bước 19. Chạy

Bấm **▶ Chạy N vòng**. App đếm ngược **3 giây** — trong lúc đó bạn chuyển sang cửa sổ game. Sau đó mỗi vòng sẽ dán một dòng và tự làm mờ dòng đó trong danh sách.

🛑 **Dừng gấp:** bấm `Escape`. Phím này chỉ có tác dụng trong lúc macro đang chạy nên không chiếm phím Esc của bạn lúc bình thường. Đổi phím này ở bảng ⚙️.

## Bước 20. Những điều phải biết trước khi dùng

⚠️ **Không phải game nào cũng ăn.** Nhiều game đọc chuột/phím theo kiểu RawInput hoặc DirectInput nên **bỏ qua hoàn toàn** thao tác giả lập, và các hệ anti-cheat (EAC, BattlEye, Vanguard…) có thể chặn hoặc đánh dấu. **Hãy thử 2–3 dòng trước khi chạy cả trăm dòng.**

⚠️ **Toạ độ ghi theo pixel màn hình.** Nếu bạn đổi độ phân giải, đổi chế độ cửa sổ/fullscreen, hay di chuyển cửa sổ game thì phải ghi lại macro.

⚠️ **Antivirus dễ báo nhầm.** App móc hook bàn phím toàn cục nên Defender/Avast có thể cảnh báo mạnh hơn trước. Xem lại Bước 6 và phần loại trừ antivirus.

---

# PHẦN E — Điều khiển cửa sổ

| Muốn làm gì | Thao tác |
|---|---|
| Di chuyển cửa sổ | Kéo thanh tiêu đề màu tối trên cùng |
| Đổi kích thước | Kéo cạnh hoặc góc cửa sổ (nhỏ nhất 300×220) |
| Làm mờ cả cửa sổ | Kéo thanh trượt nhỏ trên thanh tiêu đề (30–100%) |
| Bật/tắt xuyên chuột | Bấm nút 👆 / 👻 |
| Bật/tắt luôn nổi trên cùng | Bấm nút 📌 |
| Thu nhỏ | Bấm nút **–** |
| Đóng | Bấm nút **✕** |

## Phím tắt trong app (cần bấm vào app trước)

| Phím | Tác dụng |
|---|---|
| `Ctrl + Enter` | Chạy (khi con trỏ đang ở ô nhập) |
| `Enter` hoặc `Space` | Copy dòng đang sáng, tự nhảy xuống dòng kế tiếp |
| `Ctrl + Z` | Hoàn tác lần copy gần nhất |
| `Esc` | Quay lại ô nhập để sửa |

---

# PHẦN F — Xử lý sự cố

## Antivirus chặn hoặc tự xoá file

Phần mềm diệt virus hay báo nhầm với file `.exe` chưa ký. Thêm ngoại lệ cho **Windows Defender**:

1. **Settings** → **Privacy & security** → **Windows Security**
2. **Virus & threat protection**
3. Mục *Virus & threat protection settings* → **Manage settings**
4. Kéo xuống cuối, mục *Exclusions* → **Add or remove exclusions**
5. **Add an exclusion** → **File** → chọn file `.exe` của bạn

Phần mềm khác (Avast, AVG, Bkav…): tìm mục *Exclusions* / *Danh sách loại trừ* rồi thêm file vào tương tự.

## Bảng lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Nháy đúp mà không thấy gì | Mở Task Manager (`Ctrl + Shift + Esc`), tìm tiến trình *Overlay Copy*. Nếu có mà không thấy cửa sổ → cửa sổ đang nằm ngoài vùng nhìn thấy do vừa đổi độ phân giải màn hình. Kết thúc tiến trình rồi mở lại. |
| Báo *"This app can't run on your PC"* | Máy đang chạy Windows 32-bit hoặc chip ARM. Bản này chỉ chạy trên **x64**. |
| Chữ quá nhỏ hoặc quá to | Chuột phải file `.exe` → **Properties** → **Compatibility** → **Change high DPI settings** → tích *Override high DPI scaling behavior* → chọn **System** → OK. |
| Cửa sổ bị app khác che mất | Bấm nút 📌 để bật lại chế độ luôn nổi trên cùng. |
| Bấm 📌 rồi vẫn bị che | Có 3 trường hợp không nổi lên được: hộp thoại UAC, Task Manager chạy quyền admin, và game DirectX chạy **fullscreen exclusive**. Với game, vào phần cài đặt đồ hoạ đổi sang **Borderless / Windowed Fullscreen** là overlay hiện lên được. |
| Lỡ bật 👻 mà không tắt được | Bấm `Ctrl + Alt + Space`. Nếu vẫn không được (phím tắt bị game chiếm), mở Task Manager kết thúc tiến trình *Overlay Copy* rồi mở lại. |
| Bấm `Ctrl+Alt+C` mà không copy | Kiểm tra app còn đang chạy không, và bạn đã bấm **RUN** để có danh sách chưa. Nếu vẫn không ăn thì tổ hợp phím đã bị app khác chiếm — app sẽ hiện chữ *LỖI* ở dòng cảnh báo cam khi bật 👻. Vào nút **⚙️** đổi sang tổ hợp khác (xem *Bước 16*). |
| Tổ hợp 3 nút khó bấm quá | Bấm nút **⚙️** trên thanh tiêu đề rồi gán lại thành tổ hợp dễ hơn, kể cả một phím đơn như `;` — xem *Bước 16*. |
| Copy xong dán ra chỗ khác không đúng | Bạn vừa `Ctrl + C` ở chỗ khác nên clipboard bị ghi đè. Bấm lại nút **Copy** ở dòng đó. |
| Các dòng đã copy mờ quá không đọc được | Đúng thiết kế (mờ 90%). Muốn nhìn rõ hơn: rê chuột vào dòng đó nó sẽ sáng tạm lên. |

## Gỡ cài đặt

- **Bản portable:** xoá file `.exe` là xong. Không ghi gì vào registry.
- **Bản setup:** **Settings** → **Apps** → **Installed apps** → tìm *Overlay Copy* → **Uninstall**.
