# Vân Mộng · Cửu Thiên 2.0

Game tu tiên pixel đơn nhân trên trình duyệt: ngự kiếm, kiếm quyết nhiều hệ, NPC, tiên duyên, thu thập, luyện đan, rèn khí, tông môn và độ kiếp. Hình ảnh gốc được đóng gói trong `public/art/`, kết hợp Canvas cho địa hình, hoạt cảnh và hiệu ứng; âm thanh dùng Web Audio. Font và ảnh được phục vụ cùng game, không cần dịch vụ ảnh hay font ngoài.

Đây là game độc lập lấy cảm hứng từ thể loại tu tiên màn hình ngang, với tên gọi, hình ảnh và hệ thống riêng.

## Hướng đồ họa: toàn bộ bằng pixel

- Cảnh game được vẽ vào buffer cao 360 pixel rồi phóng 2 lần bằng nearest-neighbor; camera và mô hình chiến đấu giữ hệ tọa độ cũ.
- Cảnh đêm tiên sơn và atlas kiếm tu được tạo riêng cho game. Tám ô sprite gồm đứng, hai bước chạy, ngự kiếm, thi triển, nhập định, trưởng lão và nữ tu. Nhân vật, NPC và quái dùng sprite từng khung hình; không làm mịn khi phóng sprite hoặc icon kỹ năng.
- Atlas `techniques.png` có 12 hình minh họa chiêu thức, dùng cho thanh kỹ năng và bí tịch; kỹ năng không có ảnh dùng biểu tượng Canvas dự phòng.
- Hiệu ứng chiến đấu dùng sprite rồng / phượng riêng, atlas pháp thuật và hoạt cảnh theo thời gian trong `src/pixel/effects.js`: tụ khí, pháp trận, xuất chiêu, vệt sáng, tia va chạm và dư ảnh. Thiên thạch chạm đất ở giây 0,8, trùng thời điểm gây sát thương của mô hình.
- Atlas quái có mộc yêu, linh hồ, long, phượng, bọ cạp, u hồn, thần vệ và bạch hổ. Vách đá dùng texture rễ cây / rêu thay cho tường gạch; nền cảnh được hạ sáng để tách rõ nhân vật và kỹ năng.
- Tùy chọn giảm chuyển động tắt rung màn hình, chớp sáng, dư ảnh và các vòng quay phụ. Tắt hoa bay / đom đóm cũng giảm lượng hạt phụ của kỹ năng. Phần chính của chiêu vẫn hiện để nhận biết giao chiến.
- Tông màu nền tím chàm, hoa đào hồng, ánh ngọc lam và đèn vàng; khung giao diện gọn với viền vàng nhạt để giữ vùng chơi rõ ràng. Vách đá và địa hình dùng cụm pixel có chủ đích, hạn chế nhiễu toàn màn hình.
- Chữ Việt dùng font pixel VT323 có đủ dấu. Tên nhân vật và số chiến đấu trong cảnh được raster hóa thành bitmap một bit trước khi vẽ.
- Icon giao diện là lưới 16×16 ô vuông; khung, nút, thanh trạng thái, túi đồ và menu dùng viền pixel nhiều lớp. Ảnh linh cảnh thu nhỏ được vẽ ở độ phân giải thấp.
- Không dùng font serif, icon nét cong mảnh, bo tròn, kính mờ hay bóng đổ nhòe cho giao diện. Giữ quy ước này khi thêm nội dung mới.

Font VT323: Copyright 2011, The VT323 Project Authors, giấy phép SIL Open Font License 1.1; bản giấy phép kèm tại `public/licenses/VT323-OFL.txt`.

## Chạy game

Node.js 20.19+ hoặc 22.12+; đã kiểm tra với Node 24.

```sh
npm ci
npm run dev
```

Vite mặc định dùng cổng 5173. Nếu thư mục cache mặc định không ghi được, dùng `npm --cache /workspace/.cache/npm ci`. Các tiến trình phải khởi động lại sau khi khôi phục môi trường.

```sh
npm test               # 38 kiểm tra hành vi và tính toàn vẹn nội dung
npm run build          # Tạo bản web tĩnh trong dist/
npm run preview        # Phục vụ bản build, mặc định cổng 4173
```

Có thể phục vụ `dist/` bằng máy chủ web tĩnh. Game không cần backend, tài khoản, cơ sở dữ liệu hay API key.

## 10.104 mục nội dung được tính thế nào?

| Loại | Số mục | Tham gia vòng chơi |
| --- | ---: | --- |
| Trang bị / pháp khí | 4.800 | Rơi từ quái/boss, chế tạo, trang bị, cường hóa +10; tăng chỉ số và cộng hưởng hệ |
| Chiêu thức | 1.152 | Học qua bí tịch, gắn vào 4 phím; sát thương, linh lực, hồi chiêu và thuộc tính riêng |
| Bí tịch | 1.152 | Vật phẩm có thể mua, nhặt và tiêu hao để mở chiêu thức tương ứng |
| Nguyên liệu | 240 | Hái thảo, khai khoáng, linh vật rơi ra; được tiêu hao trong công thức |
| Đan dược | 120 | Hồi phục, tu vi, lá chắn, bạo kích, tốc độ, ngự lôi, dưỡng căn, tăng thu hoạch |
| Linh cảnh | 120 | Có thể đến khi đủ cảnh giới, với NPC, quái, boss và tài nguyên tương ứng |
| NPC | 240 | Hai NPC mỗi linh cảnh; trò chuyện, tiên duyên, đan đạo, khí đạo, tông môn |
| Linh vật | 720 | Sáu định nghĩa mỗi linh cảnh; sinh lực, sát thương, tu vi và nguyên liệu theo bậc |
| Boss | 120 | Một boss mỗi linh cảnh; đòn vùng báo trước, cuồng nộ dưới 50% sinh lực, pháp khí và bí tịch rơi ra |
| Tiên duyên | 1.440 | 12 dạng mục tiêu mỗi linh cảnh; phải nhận trước, có tiến độ và thưởng một lần |
| **Tổng** | **10.104** | **Không cộng công thức chế tạo vào tổng này** |

Dữ liệu sinh xác định từ các nền được thiết kế và biến thể thuộc tính/phẩm cấp: 30 nền trang bị × 8 hệ × 10 bậc × 2 phẩm; 48 đạo pháp gốc × 8 hệ × 3 phẩm Nhân / Tiên / Thần. Các biến thể dùng chung họ hoạt cảnh. 120 linh cảnh là 12 quần xã × 10 bậc, dùng khung địa hình cuộn ngang chung với thực vật, bầu trời, tài nguyên, quái và boss theo quần xã. NPC và nhiệm vụ được sinh theo linh cảnh; 1.440 tiên duyên dùng 12 dạng mục tiêu, không phải 1.440 cốt truyện viết riêng.

Ngoài tổng trên có 4.920 công thức thực thi được, 17 chiêu nhập môn đã mở sẵn, trang bị tân thủ và các hệ thống huyết mạch / cảnh giới. Các kiểm tra tự động thực sự chế tạo toàn bộ công thức và học toàn bộ bí tịch, kiểm tra liên kết nguồn thu / bản đồ / mục tiêu / phần thưởng.

## Kiếm thuật và hoạt cảnh theo động tác

Nhấn **K → Chỉ xem kiếm thuật** để xem thử động tác, hoặc chọn **Gắn bộ cơ bản / Gắn bộ tuyệt kỹ**. F hạ kiếm để chiến đấu trên mặt đất; giữ J nối combo chém ba nhịp. Bộ mới gồm Thanh Phong Kiếm, Ảnh Phong Bộ (tái lướt một lần), Lăng Phong Quyển (hất tung), Ngự Phong Bích (phòng thủ và làm chậm) và Thiên Vân Vô Song (bốn nhịp sát thương). Mỗi chiêu có linh lực, hồi chiêu và cơ chế thực trong vòng chơi.

Atlas `swordsman-actions.png` có 12 tư thế: đứng, ba khung chạy, lấy đà, chém xuống, chém ngược, đâm, lướt, xoay kiếm, thu kiếm và kết ấn. `choreography.js` dùng chung nhịp với `sword-effects.js` để vệt kiếm đi theo động tác. Bản này dùng hai hướng đối xứng trong thế giới màn ngang; ảnh tham khảo tám hướng được dùng để định hướng chất lượng động tác, chưa chuyển game sang thế giới di chuyển tám hướng hoặc thêm cưỡi ngựa.

## Vòng chơi

1. Mở **Cửu Thiên** để chọn một trong 8 tộc, thức tỉnh một trong 8 thiên linh căn và bái nhập một trong 12 tông môn. Các lựa chọn ảnh hưởng chỉ số thật; linh căn và tông môn cộng hưởng với hệ kỹ năng. Lần chọn đầu miễn phí.
2. Nhận **Tiên duyên** qua NPC hoặc bảng Cửu Thiên. Tối đa 8 nhiệm vụ đang nhận; tiến độ chỉ tính từ lúc nhận, trong linh cảnh chỉ định. Có thể hủy nhiệm vụ chưa nhận thưởng.
3. Chạm nút tương tác hoặc nhấn E cạnh linh thảo / khoáng thạch để thu thập. Mỏ tái sinh sau 30 giây chơi thực. Linh vật rơi tinh túy, mỗi bốn lần hạ quái có trang bị; boss luôn rơi trang bị và bí tịch.
4. Dùng nguyên liệu để **Luyện đan** hoặc **Luyện khí**. Công thức cho biết số đang có và số cần. Thiếu nguyên liệu hoặc cảnh giới không trừ bất kỳ tài nguyên nào. Trang bị đủ cảnh giới mới dùng được; cường hóa cần linh thạch và khoáng thạch.
5. Đọc bí tịch trong hành trang, mở **Kiếm quyết**, chọn chiêu và gắn phím 1–4. Đổi chiêu giữ hồi chiêu riêng, không thể dùng đổi phím để bỏ qua hồi chiêu.
6. Nhập định để tích tu vi / hồi phục, rồi đột phá khi đủ tu vi và linh thạch. Có **16 đại cảnh giới × 9 tầng = 144 cấp tu luyện**, từ Luyện Khí đến Thần Cảnh.
7. Từ tầng 9 sang đại cảnh giới kế tiếp phải vượt **9 lượt lôi kiếp**. Vùng sét có báo trước; di chuyển hoặc lướt né, dùng hộ thể / Ngự Lôi Đan. Không thể dịch chuyển khi đang độ kiếp. Thất bại giữ tu vi, mất phí dẫn kiếp; thành công tăng cảnh giới và hồi đầy trạng thái.
8. Mở vùng cao hơn trong **Đại bản đồ**. Phàm Giới: bậc 1–6; Tiên Giới: bậc 7–9 từ Nhân Tiên; Thần Giới: bậc 10 từ Thần Cảnh. Boss tiên/thần giới rơi tiên thạch/thần thạch. Có quy đổi hai chiều với phí tại Linh Thạch Các.

12 họ chiến đấu có cơ chế khác nhau: phi kiếm, phượng hỏa thiêu đốt, hồi sinh lực, lôi đình, rồng đẩy lùi, băng phong, ma vực kéo quái, kim thân hấp thụ sát thương, thiên thạch trễ, ba phân thân tự đánh, kiếm trận phá phòng và phật liên gây độc / hồi phục. Boss có bốn kiểu đòn vùng / xung kích và nhiều dạng pixel theo quần xã: long, phượng, cự mộc, bọ cạp, u hồn, thần vệ, hổ và hồ.

## Điều khiển

| Phím | Chức năng |
| --- | --- |
| A / D, ← / → | Di chuyển |
| W / S, ↑ / ↓ | Lên / xuống khi ngự kiếm |
| Space | Khinh công / bay lên |
| Shift | Lướt né, có thời gian miễn thương ngắn và hồi dùng |
| J | Trảm kiếm |
| 1–4 | Bốn chiêu đã gắn trong Kiếm quyết |
| F | Ngự kiếm / hạ kiếm |
| M / T | Nhập định / bật tự chiến |
| E | Tương tác NPC, nguyên liệu, cổ trận |
| H | Dùng Hồi Xuân Đan tân thủ |
| B / C | Hành trang / nhân vật |
| K / U | Kiếm quyết / luyện đan |
| R / N | Tộc & linh căn / tông môn |
| L / O | Điểm dừng khu vực / đại bản đồ 120 linh cảnh |
| Q / I | Truyện khởi đầu / vạn vật chí |
| ? / Esc | Hướng dẫn / đóng bảng |

Trên điện thoại có nút di chuyển, kỹ năng và nút tương tác E có thể chạm. Mọi hệ thống có trong menu Cửu Thiên. Mở bảng sẽ tạm dừng chiến đấu; nhập định cần đóng bảng để tiếp tục. Tab bị ẩn cũng tạm dừng game. Âm thanh cần thao tác người dùng để bật.

## Lưu tiến trình

Tiến trình lưu trong `localStorage` sau mỗi 3 giây và ngay sau thao tác giao diện. Bản lưu 1.0 tự chuyển sang cấu trúc phiên bản 2, giữ nhân vật, tiền, đan dược và truyện cũ, thêm các hệ thống mới. Cảnh giới, tộc, linh căn, tông môn, nguyên liệu, đồ, cường hóa, chiêu đã học / gắn, nhiệm vụ, vùng đã khám phá, hiệu quả đan và thời gian mỏ tái sinh đều được lưu.

Khi tải lại, NPC / quái của map được tạo lại; sinh lực đang mất của quái không được lưu. Phiên độ kiếp đang diễn ra giữ số lượt và phí đã trả; các vùng báo sét chưa nổ không được giữ. Không có tích tu vi khi đóng game. Có thể chơi lại trong Cài đặt. Trình duyệt chặn lưu trữ vẫn chơi được trong phiên và có báo ở chân màn hình. Dữ liệu không đồng bộ qua máy khác hay tài khoản.

## Kiểm tra trình duyệt

Khởi động máy chủ dev ở terminal khác, sau đó:

```sh
npx playwright install chromium
npm run test:browser
npm run test:expansion
npm run test:sword
```

Bộ đầu kiểm tra đường chơi nhập môn; bộ mở rộng thao tác thật qua giao diện để nhận nhiệm vụ, chọn linh căn, nhập tông, thu thập, luyện đan, rèn / cường hóa đồ, học / gắn chiêu, dịch chuyển và tải lại. Các nhân vật chuẩn bị riêng được dùng để chụp đủ 12 họ hiệu ứng và kiểm tra giao diện độ kiếp; không trộn với bản lưu chơi thử. Cả ba có kiểm tra điện thoại và lỗi runtime. Bộ kiếm thuật kiểm tra preset, hoạt cảnh xem thử, combo, tái lướt và bộ chiêu mới; đặt RECORD_SWORD_VIDEO=1 để ghi clip canvas vào test-results/sword-choreography.webm. Ảnh chụp trong `test-results/` (được Git bỏ qua).

Biến tùy chọn: `TEST_BASE_URL`, `BROWSER_EXECUTABLE_PATH`, `BROWSER_ARGS` (mảng JSON các tham số Chromium). Cài Chromium chỉ cần để kiểm thử, không cần để chạy game. Các unit test kiểm tra cả thắng và thua độ kiếp, giao dịch thiếu tiền, chế tạo thiếu nguyên liệu, giới hạn nhiệm vụ và dữ liệu lưu không hợp lệ.

## Cấu trúc dự án

- `src/expansion/content.js`: danh mục nội dung xác định, các chỉ số / công thức / tham chiếu và đếm tổng.
- `src/expansion/rules.js`: hành trang, trang bị, luyện chế, bí tịch, tộc, linh căn, tông môn, nhiệm vụ, bản đồ, tiền tệ và lôi kiếp.
- `src/expansion/ui.js`, `style.css`: các bảng Cửu Thiên có tìm kiếm, lọc bậc và phân trang.
- `src/game/world.js`: địa hình và chiêu nhập môn.
- `src/game/model.js`: vòng cập nhật, chiến đấu, tu luyện và lưu / tải; không phụ thuộc DOM.
- `src/game/art.js`, `renderer.js`: pixel art, nhân vật, boss, quần xã, camera và hoạt cảnh kỹ năng.
- `src/game/choreography.js`, `src/pixel/sword-effects.js`, `sword-preview.js`: nhịp động tác, vệt kiếm và xem thử võ học.
- `src/game/audio.js`: âm thanh tổng hợp.
- `src/pixel/assets.js`, `effects.js`, `scenery.js`: atlas cục bộ, 12 họ hoạt cảnh pháp thuật, pháp trận, va chạm và địa hình.
- `src/main.js`: điều khiển bàn phím / cảm ứng và giao diện chính.
- `tests/`: unit test dữ liệu và hành vi; ba bộ kiểm thử trình duyệt.

Đây là bản chơi đơn chạy phía trình duyệt. Chưa có hệ thống máy chủ MMO, PvP hay kinh tế giữa người chơi. Nội dung có biến thể sinh xác định; chưa có 120 bản đồ địa hình vẽ tay riêng biệt hay giọng lồng tiếng NPC.
