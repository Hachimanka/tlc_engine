import { ICON_SVGS } from "@/public/icons";
import {
  getFeaturesForInstitution,
  normalizeInstitutionType,
  type FeatureKey,
  type InstitutionType,
} from "@/features/tenant-feature-catalog";

export type TenantType = "Deped" | "College";
export type FeatureRole = string;

export type FeatureSidebarItem = {
  featureKey: FeatureKey;
  href: string;
  label: string;
  icon: string;
};

export const tenantTypeToInstitutionType = (
  tenantType: TenantType,
): InstitutionType => {
  if (tenantType === "Deped") {
    return "deped";
  }

  if (tenantType === "College") {
    return "higher_ed";
  }

  return null;
};

export function getFeatureSidebarItems(
  institutionType: InstitutionType,
  enabledFeatureKeys: string[],
) {
  const enabled = new Set(enabledFeatureKeys);
  const normalizedType = normalizeInstitutionType(institutionType);

  return getFeaturesForInstitution(normalizedType)
    .filter(
      (feature) =>
        enabled.has(feature.key) &&
        feature.status === "active" &&
        Boolean(feature.href) &&
        !feature.adminOnly,
    )
    .map<FeatureSidebarItem>((feature) => ({
      featureKey: feature.key,
      href: feature.href as string,
      label: feature.label,
      icon: ICON_SVGS[feature.iconName],
    }));
}
