"use server";

import { wixClientServer } from "./wixClientServer";

export const updateUser = async (formData: FormData) => {
  const wixClient = await wixClientServer();

  const id = formData.get("id") as string;
  const username = formData.get("username") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  try {
    await wixClient.members.updateMember(id, {
      contact: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phones: [phone] || undefined,
      },
      loginEmail: email || undefined,
      profile: { nickname: username || undefined },
    });

  } catch (err) {
    console.error("Updating the member profile failed:", err instanceof Error ? err.message : "unknown error");
  }
};
