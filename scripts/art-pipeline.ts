import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { z } from "zod";
import { ASSET_KINDS } from "../src/assets/registry";
import { campaignDefinition } from "../src/content/campaign";

const root = resolve(import.meta.dirname, "..");
const pack = join(root, "art/production-a2");
const kindSchema = z.enum(ASSET_KINDS);
const jobSchema = z.object({
  key: z.string(),
  assetId: z.string(),
  kind: kindSchema,
  label: z.string(),
  master: z.string(),
  transparent: z.boolean(),
  prompt: z.string(),
});
const jobs = z
  .object({ jobs: z.array(jobSchema) })
  .parse(JSON.parse(readFileSync(join(pack, "jobs.json"), "utf8"))).jobs;
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
export function imageSize(bytes: Buffer): {
  width: number;
  height: number;
  alpha: boolean;
} {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      alpha: [4, 6].includes(bytes[25] ?? -1),
    };
  if (bytes[0] === 255 && bytes[1] === 216) {
    let pos = 2;
    while (pos + 8 < bytes.length) {
      if (bytes[pos] !== 255) throw new Error("Invalid JPEG marker");
      while (bytes[pos] === 255) pos++;
      const marker = bytes[pos++];
      if (marker === 216 || marker === 217) continue;
      const length = bytes.readUInt16BE(pos);
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker ?? -1)
      )
        return {
          height: bytes.readUInt16BE(pos + 3),
          width: bytes.readUInt16BE(pos + 5),
          alpha: false,
        };
      if (length < 2) break;
      pos += length;
    }
  }
  throw new Error("Unsupported or malformed PNG/JPEG");
}
function metadata(file: string) {
  const bytes = readFileSync(file);
  return { ...imageSize(bytes), bytes: bytes.length, sha256: hash(bytes) };
}
const reused = [
  {
    assetId: "asset.world.overview",
    kind: "location" as const,
    label: "Bản đồ Bắc Sơn",
    master: "../asset-pack-a1/world-map-a1.png",
    transparent: false,
  },
  {
    assetId: "asset.location.garage",
    kind: "location" as const,
    label: "Gara cuối phố",
    master: "../asset-pack-a1/garage-departure-a1.png",
    transparent: false,
  },
  {
    assetId: "asset.character.minh",
    kind: "portrait" as const,
    label: "Minh",
    master: "../asset-pack-a1/minh-portrait-a1.png",
    transparent: false,
  },
  {
    assetId: "asset.vehicle.bus",
    kind: "vehicle" as const,
    label: "Xe khách số 07",
    master: "../asset-pack-a1/convoy-bus-a1.png",
    transparent: true,
  },
];
const eventAliases: Record<string, string> = {
  "event.departure": "asset.location.garage",
  "event.market-survivor": "asset.event.market-survivor",
  "event.market-cache": "asset.location.market",
  "event.overpass-echo": "asset.location.overpass",
  "event.service-depot": "asset.location.service",
  "event.service-stranger": "asset.location.service",
  "event.hospital-bell": "asset.anomaly.bell",
  "event.hospital-records": "asset.event.hospital-records",
  "event.ward-patient": "asset.location.ward",
  "event.ward-mirror": "asset.location.ward",
  "event.checkpoint-parley": "asset.event.checkpoint-parley",
  "event.checkpoint-aftermath": "asset.location.checkpoint",
};
const catalogPath = join(root, "src/client/art/catalog.json");
const manifestPath = join(pack, "build-manifest.json");
const catalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    packId: z.literal("last-convoy.art.a2"),
    assets: z.array(
      z
        .object({
          id: z.string(),
          kind: kindSchema,
          label: z.string(),
          uri: z.string(),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
        })
        .strict(),
    ),
  })
  .strict();

function validate() {
  const catalog = catalogSchema.parse(
    JSON.parse(readFileSync(catalogPath, "utf8")),
  );
  const ids = new Set<string>();
  const known = new Map(
    campaignDefinition.campaign!.assets.map((a) => [a.id, a.kind]),
  );
  for (const asset of catalog.assets) {
    if (ids.has(asset.id)) throw new Error(`Duplicate art ID: ${asset.id}`);
    ids.add(asset.id);
    if (
      asset.id !== "asset.world.overview" &&
      known.get(asset.id) !== asset.kind
    )
      throw new Error(`Unknown art reference/kind: ${asset.id}`);
    if (!/^\/art\/a2\/[a-z0-9.-]+\.(jpg|png)$/.test(asset.uri))
      throw new Error(`Invalid local art URI: ${asset.uri}`);
    const data = metadata(join(root, "public", asset.uri));
    if (
      data.width !== asset.width ||
      data.height !== asset.height ||
      data.sha256 !== asset.sha256
    )
      throw new Error(`Art metadata mismatch: ${asset.id}`);
    if (asset.kind === "vehicle" && !data.alpha)
      throw new Error(`Vehicle lacks alpha: ${asset.id}`);
  }
  const required = campaignDefinition.campaign!.assets.filter(
    (a) =>
      [
        "location",
        "event",
        "portrait",
        "skill",
        "artifact",
        "anomaly",
        "vehicle",
      ].includes(a.kind) && !a.id.startsWith("asset.fallback."),
  );
  for (const asset of required)
    if (!ids.has(asset.id))
      throw new Error(`Missing production art: ${asset.id}`);
  if (catalog.assets.length !== 38)
    throw new Error(`Expected 38 art mappings, got ${catalog.assets.length}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    masters: { master: string; sha256: string }[];
  };
  if (manifest.masters.length !== 29)
    throw new Error("Expected 29 selected masters");
  for (const master of manifest.masters)
    if (metadata(resolve(pack, master.master)).sha256 !== master.sha256)
      throw new Error(`Master changed: ${master.master}`);
  const unique = new Set(catalog.assets.map((a) => a.uri));
  const total = [...unique].reduce(
    (sum, uri) => sum + readFileSync(join(root, "public", uri)).length,
    0,
  );
  console.log(
    `Art A2 valid: 29 masters, ${catalog.assets.length} mappings, ${unique.size} web images, ${(total / 1024 / 1024).toFixed(2)} MiB. IDs, kinds, coverage, PNG/JPEG dimensions, SHA-256 and alpha channels verified.`,
  );
}

if (process.argv.includes("--validate")) validate();
else {
  if (process.platform !== "darwin")
    throw new Error(
      "art:build uses macOS sips. Committed web images work on every platform; runtime/build does not require sips.",
    );
  const receipts = readdirSync(join(pack, "receipts"))
    .filter((f) => f.endsWith(".json"))
    .map(
      (f) =>
        JSON.parse(readFileSync(join(pack, "receipts", f), "utf8")) as {
          key: string;
          master: string;
          revision?: number;
        },
    );
  const selected = [
    ...reused,
    ...jobs.map((job) => ({
      ...job,
      master:
        receipts
          .filter((r) => r.key === job.key)
          .sort((a, b) => (b.revision ?? 1) - (a.revision ?? 1))[0]?.master ??
        job.master,
    })),
  ];
  for (const item of selected) {
    const file = resolve(pack, item.master);
    if (!file.startsWith(join(root, "art") + sep) || !existsSync(file))
      throw new Error(`Missing/invalid master: ${item.master}`);
    if (item.transparent && !metadata(file).alpha)
      throw new Error(`Master lacks alpha: ${item.assetId}`);
  }
  const out = join(root, "public/art/a2");
  mkdirSync(out, { recursive: true });
  mkdirSync(dirname(catalogPath), { recursive: true });
  const assets: z.infer<typeof catalogSchema>["assets"] = [];
  const masters = [];
  for (const item of selected) {
    const source = resolve(pack, item.master);
    const name =
      item.assetId.replace(/^asset\./, "") +
      (item.transparent ? ".png" : ".jpg");
    const target = join(out, name);
    const limit =
      item.assetId === "asset.world.overview"
        ? 1800
        : item.kind === "portrait"
          ? 640
          : ["skill", "artifact"].includes(item.kind)
            ? 320
            : item.kind === "vehicle"
              ? 768
              : 1600;
    const args = [
      "-s",
      "format",
      item.transparent ? "png" : "jpeg",
      ...(!item.transparent ? ["-s", "formatOptions", "84"] : []),
      "-Z",
      String(limit),
      source,
      "--out",
      target,
    ];
    const result = spawnSync("/usr/bin/sips", args, { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout);
    const web = metadata(target);
    assets.push({
      id: item.assetId,
      kind: item.kind,
      label: item.label,
      uri: `/art/a2/${name}`,
      width: web.width,
      height: web.height,
      sha256: web.sha256,
    });
    masters.push({
      id: item.assetId,
      master: item.master,
      ...metadata(source),
      web: `/art/a2/${name}`,
    });
  }
  for (const event of campaignDefinition.campaign!.events) {
    const source = assets.find((a) => a.id === eventAliases[event.id]);
    if (!source) throw new Error(`Missing event artwork: ${event.id}`);
    if (source.id === `asset.${event.id}`) continue;
    assets.push({
      ...source,
      id: `asset.${event.id}`,
      kind: "event",
      label: campaignDefinition.campaign!.texts[event.titleKey] ?? event.id,
    });
  }
  writeFileSync(
    catalogPath,
    JSON.stringify(
      { schemaVersion: 1, packId: "last-convoy.art.a2", assets },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(join(out, "catalog.json"), readFileSync(catalogPath));
  const galleryPath = join(out, "gallery.html");
  const embedded = JSON.stringify({ assets }).replaceAll("<", "\\u003c");
  writeFileSync(
    galleryPath,
    readFileSync(galleryPath, "utf8").replace(
      /<!-- ART_CATALOG_START -->[\s\S]*?<!-- ART_CATALOG_END -->/,
      `<!-- ART_CATALOG_START -->\n<script id="art-catalog" type="application/json">${embedded}</script>\n<!-- ART_CATALOG_END -->`,
    ),
  );
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        schemaVersion: 1,
        tool: "built-in image_gen",
        derivativeTool: "macOS sips: resize/encode only",
        masters,
      },
      null,
      2,
    ) + "\n",
  );
  validate();
}
