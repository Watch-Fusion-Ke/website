import { wixClientServer } from "@/lib/wixClientServer";
import { buildMenu } from "@/lib/siteMenu";
import CategoryRow from "./CategoryRow";

// The store's visible categories, grouped so the row stays short however many categories there are.
const CategoryList = async () => {
  try {
    const wixClient = await wixClientServer();
    const cats = await wixClient.collections.queryCollections().find();
    const menu = buildMenu(cats.items.map((c) => ({ name: c.name ?? "", slug: c.slug ?? "", visible: c.visible })));
    return <CategoryRow menu={menu} />;
  } catch (e) {
    console.error("CategoryList: category list failed", e);
    return null;
  }
};

export default CategoryList;
