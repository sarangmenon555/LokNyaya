import { z } from "zod";
import limitationPack from "../../../packs/limitation-act-1963.json";
import consumerPack from "../../../packs/consumer-protection-2019.json";
import rtiPack from "../../../packs/rti-act-2005.json";
import klTenancyPack from "../../../packs/kl-tenancy.json";
import tnTenancyPack from "../../../packs/tn-tenancy-2017.json";
import jurisdictionList from "../../../packs/jurisdictions.json";
import directoryData from "../../../packs/directory.json";
import concordanceData from "../../../packs/concordance.json";
import { buildRegistry } from "./registry";
import { concordanceSchema, directorySchema, jurisdictionSchema, packSchema } from "./schema";

export const registry = buildRegistry(
  [limitationPack, consumerPack, rtiPack, klTenancyPack, tnTenancyPack].map((pack) => packSchema.parse(pack))
);

export const jurisdictions = z.array(jurisdictionSchema).parse(jurisdictionList);

export const directory = directorySchema.parse(directoryData);

export const concordance = concordanceSchema.parse(concordanceData);
