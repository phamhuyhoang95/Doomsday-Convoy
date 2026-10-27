export const campaignFacts = Object.entries({
  "story.departed": "Đoàn đã chuẩn bị để rời thành phố.",
  "story.rescued": "Hà, người sửa vô tuyến ở chợ, đã được cứu lên xe.",
  "story.abandoned": "Hà bị bỏ lại ở chợ sơ tán.",
  "story.survivor-resolved": "Đoàn đã quyết định số phận người ở chợ.",
  "story.generous": "Bạn chia thuốc với người lạ tại trạm dịch vụ.",
  "story.patient-helped": "Lan đã chữa trị người bệnh ở khu điều trị cũ.",
  "cache.searched": "Kho hàng ở chợ đã được xử lý.",
  "road.warning": "Các vạch phản quang giúp tránh lối đường đang sụp.",
  "depot.searched": "Kho trạm dịch vụ đã được kiểm tra.",
  "hospital.rule":
    "Không trả lời tiếng gọi khi chuông ngân. Im lặng cho phép chạm vào Mắt gương.",
  "hospital.violated":
    "Đoàn đã vi phạm quy tắc và chịu tổn thương bởi tiếng gọi.",
  "hospital.resolved":
    "Mối nguy ở bệnh viện đã được xử lý hoặc vượt qua bằng giải pháp khác.",
  "hospital.records": "Hồ sơ ở bệnh viện đã được kiểm tra.",
  "hospital.records-burned": "Bạn đã đốt hồ sơ và mất những manh mối trong đó.",
  "hospital.quarantined": "Bệnh viện bị niêm phong; đèn là con đường dự phòng.",
  "ward.patient-resolved": "Đoàn đã quyết định giúp hay bỏ qua người bệnh.",
  "rival.motive":
    "Tro Tàn tìm kỳ vật vì con gái thủ lĩnh đang bị tiếng gọi ám. Họ có thể nghe lời thuyết phục.",
  "rival.resolved": "Đoàn đã giải quyết cuộc đối đầu ở trạm thu phí.",
  "rival.dead": "Không ai trong đoàn Tro Tàn còn sống.",
  "rival.defeated": "Tro Tàn đã bị đánh bại; loot đã đổi chủ.",
  "rival.captured": "Bạn đã bắt giữ ít nhất một người Tro Tàn khi họ gục ngã.",
  "rival.mercy": "Bạn đã dùng thuốc để chăm sóc những người bị bắt.",
  "rival.peaceful":
    "Cuộc tranh đoạt được giải quyết bằng lời nói hoặc trao đổi.",
  "rival.surrendered": "Bạn nhường cuộc đối đầu để giữ đoàn sống sót.",
  "rival.escaped": "Đoàn thoát khỏi trận chiến qua đường rút lui.",
  "rival.stole-mirror":
    "Tro Tàn đã tới Mắt gương trước đoàn. Kỳ vật hiện theo đối thủ.",
  "checkpoint.settled":
    "Những việc cuối cùng ở trạm thu phí đã được giải quyết.",
  "journey.refuge-reached": "Đoàn đã tới hầm trú Bắc Sơn.",
}).map(([id, description]) => ({
  id,
  description,
  ...(id === "hospital.rule" ? { initialValue: true } : {}),
}));
