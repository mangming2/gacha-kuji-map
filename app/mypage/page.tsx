import { redirect } from "next/navigation";
import { getMyProfile, getMyCommentReports } from "@/app/actions/owner";
import { MypageClient } from "./mypage-client";

export const dynamic = "force-dynamic";

export default async function MypagePage() {
  const profile = await getMyProfile();
  if (!profile) {
    redirect("/owner/login?next=/mypage");
  }

  const myComments = await getMyCommentReports();

  return (
    <MypageClient
      initialProfile={profile}
      initialMyComments={myComments}
    />
  );
}
