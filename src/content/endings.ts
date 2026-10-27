import { all, always, any, fact, not, owns } from "./builders";
import type { CampaignContent } from "../narrative/schema";

export const campaignEndings: CampaignContent["endings"] = [
  {
    id: "ending.keepers",
    titleKey: "ending.keepers.title",
    textKey: "ending.keepers.text",
    when: all(
      owns("artifact.mirror"),
      owns("artifact.lantern"),
      fact("story.rescued"),
      any(fact("rival.peaceful"), fact("rival.mercy")),
    ),
  },
  {
    id: "ending.blood-road",
    titleKey: "ending.blood-road.title",
    textKey: "ending.blood-road.text",
    when: all(owns("artifact.mirror"), fact("rival.dead")),
  },
  {
    id: "ending.shared-dawn",
    titleKey: "ending.shared-dawn.title",
    textKey: "ending.shared-dawn.text",
    when: all(
      owns("artifact.mirror"),
      fact("story.rescued"),
      any(fact("rival.peaceful"), fact("rival.captured")),
    ),
  },
  {
    id: "ending.last-light",
    titleKey: "ending.last-light.title",
    textKey: "ending.last-light.text",
    when: owns("artifact.mirror"),
  },
  {
    id: "ending.borrowed-dawn",
    titleKey: "ending.borrowed-dawn.title",
    textKey: "ending.borrowed-dawn.text",
    when: all(fact("rival.peaceful"), not(owns("artifact.mirror"))),
  },
  {
    id: "ending.empty-handed",
    titleKey: "ending.empty-handed.title",
    textKey: "ending.empty-handed.text",
    when: always,
  },
];
