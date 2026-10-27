import {
  all,
  always,
  any,
  choice,
  event,
  fact,
  known,
  not,
  owns,
  reward,
  setFact,
} from "./builders";

const departure = event("departure", "location.garage", [
  choice("prepare", [
    setFact("story.departed"),
    reward("food", 12),
    reward("water", 12),
  ]),
  choice("rush", [setFact("story.departed"), reward("fuel", 4)]),
]);
const survivor = event(
  "market-survivor",
  "location.market",
  [
    choice(
      "rescue-ha",
      [
        { op: "rescue", actorId: "character.ha" },
        setFact("story.rescued"),
        setFact("story.survivor-resolved"),
        reward("food", 9),
        reward("water", 9),
      ],
      always,
      { medicine: 1, food: 3, water: 3 },
    ),
    choice("leave-ha", [
      setFact("story.abandoned"),
      setFact("story.survivor-resolved"),
    ]),
  ],
  always,
  40,
);
const cache = event(
  "market-cache",
  "location.market",
  [
    choice(
      "search-cache",
      [
        reward("food", 12),
        reward("water", 12),
        reward("medicine", 1),
        setFact("cache.searched"),
      ],
      always,
      { scrap: 1 },
    ),
    choice("leave-cache", [setFact("cache.searched")]),
  ],
  fact("story.survivor-resolved"),
  20,
);
cache.choices[0]!.outcomes = [
  {
    weight: 3,
    textKey: "outcome.search-cache",
    effects: [
      reward("food", 12),
      reward("water", 12),
      reward("medicine", 1),
      setFact("cache.searched"),
    ],
    hooks: [],
  },
  {
    weight: 1,
    textKey: "outcome.cache-trap",
    effects: [
      reward("food", 6),
      reward("water", 9),
      reward("fuel", 3),
      { op: "damage", target: "vehicle", amount: 5 },
      setFact("cache.searched"),
    ],
    hooks: [],
  },
];
const overpass = event("overpass-echo", "location.overpass", [
  choice("follow-reflectors", [
    setFact("road.warning"),
    { op: "repair", amount: 6 },
  ]),
  choice("answer-echo", [
    { op: "anomaly", anomalyId: "anomaly.bell", obey: false },
    reward("fuel", 3),
  ]),
]);
const depot = event(
  "service-depot",
  "location.service",
  [
    choice(
      "take-lantern",
      [
        {
          op: "artifact",
          artifactId: "artifact.lantern",
          fromOwnerId: "location.service",
          toOwnerId: "convoy.player",
        },
        reward("fuel", 6),
        reward("food", 9),
        reward("water", 12),
        reward("scrap", 3),
        setFact("depot.searched"),
      ],
      owns("artifact.lantern", "location.service"),
      { scrap: 2 },
    ),
    choice("strip-pump", [
      reward("fuel", 8),
      reward("scrap", 4),
      setFact("depot.searched"),
    ]),
    choice("bypass-depot", [setFact("depot.searched")]),
  ],
  always,
  40,
);
const stranger = event(
  "service-stranger",
  "location.service",
  [
    choice(
      "aid-stranger",
      [setFact("rival.motive"), setFact("story.generous"), reward("water", 12)],
      always,
      { medicine: 1 },
    ),
    choice("listen-stranger", [setFact("rival.motive")]),
    choice(
      "quarantine-hospital",
      [
        { op: "location", locationId: "location.hospital", accessible: false },
        { op: "location", locationId: "location.ward", accessible: false },
        setFact("hospital.quarantined"),
      ],
      owns("artifact.lantern"),
    ),
  ],
  fact("depot.searched"),
  20,
);
const bell = event(
  "hospital-bell",
  "location.hospital",
  [
    choice("listen", [
      { op: "anomaly", anomalyId: "anomaly.bell", obey: true },
    ]),
    choice("ignore-bell", [
      { op: "anomaly", anomalyId: "anomaly.bell", obey: false },
      setFact("hospital.violated"),
    ]),
  ],
  always,
  40,
);
const records = event(
  "hospital-records",
  "location.hospital",
  [
    choice("read-records", [
      setFact("rival.motive"),
      setFact("hospital.records"),
      reward("medicine", 1),
    ]),
    choice("burn-records", [
      setFact("hospital.records"),
      setFact("hospital.records-burned"),
      reward("medicine", 2),
    ]),
    choice("leave-records", [setFact("hospital.records")]),
  ],
  known("hospital.rule"),
  20,
);
const patient = event(
  "ward-patient",
  "location.ward",
  [
    choice(
      "treat-patient",
      [
        setFact("story.patient-helped"),
        setFact("ward.patient-resolved"),
        setFact("rival.motive"),
        reward("food", 6),
        reward("water", 9),
      ],
      { op: "actor", actorId: "character.lan", status: "active" },
      { medicine: 1 },
    ),
    choice("ignore-patient", [setFact("ward.patient-resolved")]),
  ],
  always,
  40,
);
patient.variants = [
  { when: fact("story.rescued"), textKey: "event.ward-patient.rescued" },
];
const mirror = event(
  "ward-mirror",
  "location.ward",
  [
    choice(
      "bind-mirror",
      [
        {
          op: "artifact",
          artifactId: "artifact.mirror",
          fromOwnerId: "location.ward",
          toOwnerId: "convoy.player",
        },
        setFact("hospital.resolved"),
      ],
      all(known("hospital.rule"), owns("artifact.mirror", "location.ward")),
    ),
    choice(
      "force-mirror",
      [
        { op: "anomaly", anomalyId: "anomaly.bell", obey: false },
        {
          op: "artifact",
          artifactId: "artifact.mirror",
          fromOwnerId: "location.ward",
          toOwnerId: "convoy.player",
        },
        setFact("hospital.resolved"),
        setFact("hospital.violated"),
      ],
      owns("artifact.mirror", "location.ward"),
      { medicine: 2 },
    ),
    choice(
      "recover-trail",
      [setFact("hospital.resolved"), setFact("rival.stole-mirror")],
      owns("artifact.mirror", "convoy.rival"),
    ),
    choice("seal-ward", [
      setFact("hospital.resolved"),
      { op: "location", locationId: "location.ward", accessible: false },
    ]),
  ],
  fact("ward.patient-resolved"),
  20,
);
const parley = event(
  "checkpoint-parley",
  "location.checkpoint",
  [
    choice(
      "signal-passage",
      [setFact("rival.resolved"), setFact("rival.peaceful")],
      any(known("rival.motive"), fact("story.rescued")),
    ),
    choice(
      "trade-mirror",
      [
        {
          op: "artifact",
          artifactId: "artifact.mirror",
          fromOwnerId: "convoy.player",
          toOwnerId: "convoy.rival",
        },
        setFact("rival.resolved"),
        setFact("rival.peaceful"),
        reward("fuel", 6),
      ],
      owns("artifact.mirror"),
    ),
    choice("fight", [
      { op: "combat", enemyConvoyId: "convoy.rival", ambush: false },
    ]),
    choice(
      "ambush",
      [{ op: "combat", enemyConvoyId: "convoy.rival", ambush: true }],
      { op: "resource", resource: "scrap", atLeast: 2 },
      { scrap: 2 },
    ),
    choice("yield-passage", [
      setFact("rival.resolved"),
      setFact("rival.surrendered"),
      { op: "damage", target: "vehicle", amount: 10 },
    ]),
  ],
  all(fact("hospital.resolved"), not(fact("rival.resolved"))),
  20,
);
parley.variants = [
  { when: fact("story.rescued"), textKey: "event.checkpoint-parley.rescued" },
  {
    when: owns("artifact.mirror", "convoy.rival"),
    textKey: "event.checkpoint-parley.stolen",
  },
];
const aftermath = event(
  "checkpoint-aftermath",
  "location.checkpoint",
  [
    choice(
      "care-captives",
      [
        { op: "restore", target: "captives", amount: 12 },
        setFact("rival.mercy"),
        setFact("checkpoint.settled"),
        reward("scrap", 4),
      ],
      fact("rival.captured"),
      { medicine: 2 },
    ),
    choice(
      "share-fire",
      [
        { op: "restore", target: "crew", amount: 12 },
        { op: "repair", amount: 8 },
        setFact("checkpoint.settled"),
      ],
      always,
      { food: 3, water: 3 },
    ),
    choice("press-on", [setFact("checkpoint.settled")]),
  ],
  fact("rival.resolved"),
  40,
);
aftermath.variants = [
  {
    when: fact("rival.captured"),
    textKey: "event.checkpoint-aftermath.captives",
  },
  { when: fact("rival.dead"), textKey: "event.checkpoint-aftermath.dead" },
];

export const campaignEvents = [
  departure,
  survivor,
  cache,
  overpass,
  depot,
  stranger,
  bell,
  records,
  patient,
  mirror,
  parley,
  aftermath,
];
for (const entry of [departure, bell, mirror, parley]) entry.version = 2;
