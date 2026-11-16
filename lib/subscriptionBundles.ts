import type { AirtelData } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";

export function subscriptionBundleView(subscriptions: Subscription[], airtel: AirtelData, today: string): Subscription[] {
  return subscriptions.map(subscription => {
    let result = subscription;
    if (subscription.cycle === "bundled" && subscription.bundleRechargeId && airtel.plan?.id === subscription.bundleRechargeId) {
      result = { ...subscription, bundlePlan: airtel.plan, bundledSince: airtel.plan.startDate, bundleEndDate: airtel.plan.endDate };
    }
    if (result.status === "active" && result.cycle === "bundled" && result.bundleEndDate && result.bundleEndDate < today) result = { ...result, status: "unconfirmed" };
    return result;
  });
}
