import type { ScenarioDefinition } from "../scenario/schema";

export const marketBlackoutScenario: ScenarioDefinition = {
  id: "scenario.market-blackout",
  name: "Đột Kích Chợ Mất Điện",
  locationId: "location.market",
  description:
    "Khu chợ đầu mối chìm trong màn đêm sau vụ cúp điện. Hà đang bị kẹt ở buồng quản lý phía sau, trong khi toán cướp kho đang rải người canh gác xung quanh bãi xe và trạm phát điện.",
  startNodeId: "node.parking",
  nodes: [
    {
      id: "node.parking",
      name: "Bãi Đỗ Xe Tải",
      roleHint: "Căn cứ đoàn xe · Điểm xuất phát & Rút lui",
      description:
        "Chiếc xe tải của đoàn đỗ sát hàng rào bên ngoài. Người giữ xe ở đây luôn sẵn sàng nổ máy yểm trợ khi đội ngoài rút lui.",
      xPercent: 12,
      yPercent: 72,
      connectedNodeIds: ["node.stalls"],
      actions: [],
    },
    {
      id: "node.stalls",
      name: "Dãy Sạp Hàng & Cổng Chợ",
      roleHint: "Trinh sát lối đi · Lục lọi nhẹ",
      description:
        "Dãy sạp rau củ đổ nát che khuất tầm nhìn. Vết bùn và tàn thuốc cho thấy toán cướp kho vừa đi tuần qua đây.",
      xPercent: 32,
      yPercent: 55,
      connectedNodeIds: ["node.parking", "node.power", "node.warehouse"],
      actions: [
        {
          id: "act.scout-stalls",
          name: "Trinh sát dấu chân toán cướp",
          description:
            "Minh và đồng đội quan sát bóng lính gác và đường dây điện dẫn vào kho.",
          alertCost: 0,
          factId: "market.scouted",
        },
        {
          id: "act.loot-stalls",
          name: "Lục sạp thực phẩm khô",
          description:
            "Thu nhặt một ít lương khô và nước đóng chai còn sót lại dưới quầy (+3 Food, +3 Water).",
          alertCost: 1,
        },
      ],
    },
    {
      id: "node.power",
      name: "Trạm Biến Áp & Phòng Điện",
      roleHint: "Bật điện chợ · Điểm mấu chốt",
      description:
        "Một máy phát điện diesel cỡ lớn nằm cạnh tủ bảng điện trung tâm. Bật máy phát sẽ cấp điện mở toàn bộ cửa từ của chợ, nhưng tiếng nổ máy sẽ vang dội khắp khu vực.",
      xPercent: 52,
      yPercent: 28,
      connectedNodeIds: ["node.stalls", "node.warehouse"],
      actions: [
        {
          id: "act.start-generator",
          name: "Khởi động máy phát điện chính",
          description:
            "Giật nổ máy phát! Toàn bộ đèn và cửa từ của chợ sáng rực, nhưng tiếng ồn vang dội khắp bãi xe (+2 Cảnh giới).",
          alertCost: 2,
        },
        {
          id: "act.wire-silently",
          name: "Bảo đấu dây ngầm êm ái (Cần Thợ máy)",
          description:
            "Bảo dùng 1 phế liệu nối tắt rơ-le để mở điện riêng cho các cửa then chốt mà không cần nổ máy phát (+0 Cảnh giới).",
          requiredRole: "mechanic",
          alertCost: 0,
        },
      ],
    },
    {
      id: "node.warehouse",
      name: "Kho Hàng & Xe Bán Tải",
      roleHint: "Vật tư quân sự · 2 khe mang đồ",
      description:
        "Chiếc xe bán tải hoang chất đầy can xăng kim loại và hòm phụ tùng. Sức chứa ba-lô có hạn, đội thám hiểm chỉ có thể vác tối đa 2 kiện hàng về xe.",
      xPercent: 72,
      yPercent: 62,
      connectedNodeIds: ["node.stalls", "node.power", "node.backroom"],
      actions: [
        {
          id: "act.take-fuel",
          name: "Vác Can Xăng Quân Sự (15 Lít)",
          description:
            "Thùng xăng dự trữ giúp đoàn xe vượt qua các chặng đường dài tiếp theo (+15 Fuel khi về xe).",
          alertCost: 1,
          itemReward: "cargo.fuel",
        },
        {
          id: "act.take-scrap",
          name: "Vác Hòm Linh Kiện & Kim Loại",
          description:
            "Hòm phụ tùng máy móc dùng để sửa chữa xe và lắp ráp module nâng cấp (+10 Scrap khi về xe).",
          alertCost: 1,
          itemReward: "cargo.scrap",
        },
        {
          id: "act.take-generator",
          name: "Vác Máy Phát Điện Cầm Tay",
          description:
            "Máy phát điện xách tay cực kỳ giá trị để chế tạo Thùng Nhiên Liệu Phụ hoặc Trạm Sơ Cứu (+10 Fuel, +10 Scrap khi về xe).",
          alertCost: 1,
          itemReward: "cargo.generator",
        },
      ],
    },
    {
      id: "node.backroom",
      name: "Buồng Quản Lý Phía Sau",
      roleHint: "Nơi giam giữ Hà · Cửa cuốn sắt",
      description:
        "Cánh cửa sắt kiên cố dẫn vào buồng điều hành. Phía sau cửa, tiếng gõ cầu cứu của Hà vọng ra từng nhịp yếu ớt.",
      xPercent: 88,
      yPercent: 36,
      connectedNodeIds: ["node.warehouse"],
      actions: [
        {
          id: "act.rescue-ha",
          name: "Mở cửa giải cứu Hà",
          description:
            "Nếu chợ đã có điện, chỉ cần nhấn công tắc điều khiển. Nếu chưa có điện, cần cạy cửa sắt.",
          alertCost: 0,
        },
      ],
    },
  ],
};
