import { all, any, always, fact, not, owns, quest, setFact } from "./builders";

const departure = quest(
  "departure",
  fact("story.departed"),
  not({ op: "at", locationId: "location.garage" }),
);
const hospital = quest(
  "hospital",
  fact("hospital.resolved"),
  all(
    { op: "location", locationId: "location.ward", accessible: false },
    owns("artifact.lantern"),
  ),
  [setFact("hospital.resolved")],
);
hospital.dependencies = ["quest.departure"];
const rival = quest("rival", fact("rival.resolved"), fact("rival.dead"), [
  setFact("rival.resolved"),
]);
rival.dependencies = ["quest.hospital"];
const rescue = quest(
  "rescue",
  fact("story.rescued"),
  any(
    { op: "location", locationId: "location.market", accessible: false },
    fact("journey.refuge-reached"),
  ),
);
rescue.preconditions = any(
  { op: "at", locationId: "location.market" },
  fact("story.rescued"),
  fact("story.abandoned"),
);
rescue.failureWhen = fact("story.abandoned");
departure.preconditions = always;
export const campaignQuests = [departure, hospital, rival, rescue];
