import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/hooks/useCartStore";

const line = (id: string, name: string) => ({ _id: id, productName: { original: name } });
const clientWith = (lineItems: unknown[]) =>
  ({ currentCart: { getCurrentCart: async () => ({ lineItems }) } }) as never;

beforeEach(() => useCartStore.setState({ cart: {} as never, counter: 0, isLoading: false }));

describe("cart counter", () => {
  it("counts the products, not the delivery fee line", async () => {
    await useCartStore.getState().getCart(clientWith([line("1", "Watch"), line("2", "Mug"), line("3", "Delivery: Gigiri, Limuru Road")]));
    expect(useCartStore.getState().counter).toBe(2);
  });

  it("is zero for a cart that holds only a delivery fee", async () => {
    await useCartStore.getState().getCart(clientWith([line("3", "Delivery: Gigiri, Limuru Road")]));
    expect(useCartStore.getState().counter).toBe(0);
  });

  it("still counts every product when there is no delivery line", async () => {
    await useCartStore.getState().getCart(clientWith([line("1", "Watch")]));
    expect(useCartStore.getState().counter).toBe(1);
  });
});
