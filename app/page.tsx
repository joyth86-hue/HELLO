"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { loadGlobalData, setUserName } from "@/lib/storage";

type Status = "checking" | "onboarding-input" | "onboarding-confirm" | "ready";

export default function StartPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [nameInput, setNameInput] = useState("");
  const [loginName, setLoginName] = useState("");

  useEffect(() => {
    const data = loadGlobalData();
    if (data.userName) {
      setLoginName(data.userName);
      setStatus("ready");
    } else {
      setStatus("onboarding-input");
    }
  }, []);

  const handleSubmitName = () => {
    if (!nameInput.trim()) return;
    setStatus("onboarding-confirm");
  };

  const handleConfirmYes = () => {
    const trimmed = nameInput.trim();
    const updated = setUserName(trimmed);
    setLoginName(updated.userName);
    setStatus("ready");
  };

  const handleConfirmNo = () => {
    setStatus("onboarding-input");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-16 bg-white p-6 text-center">
      {status === "ready" && loginName && (
        <p className="absolute left-4 top-4 text-sm font-medium text-zinc-600">
          ログイン名：{loginName}
        </p>
      )}

      <Logo className="animate-fade-up" />

      {status === "onboarding-input" && (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <p className="text-lg font-medium text-black">あなたのお名前は？</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={20}
            className="w-full rounded-lg border border-zinc-400 bg-white px-4 py-3 text-center text-black outline-none focus:border-black"
            placeholder="なまえ"
          />
          <button
            onClick={handleSubmitName}
            disabled={!nameInput.trim()}
            className="rounded-full bg-black px-10 py-3 font-semibold text-white transition-colors active:bg-zinc-700 disabled:bg-zinc-300"
          >
            OK
          </button>
        </div>
      )}

      {status === "onboarding-confirm" && (
        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <p className="text-lg font-medium text-black">
            {nameInput.trim()}さんでいいですか？
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleConfirmYes}
              className="rounded-full bg-black px-8 py-3 font-semibold text-white transition-colors active:bg-zinc-700"
            >
              はい
            </button>
            <button
              onClick={handleConfirmNo}
              className="rounded-full border border-black px-8 py-3 font-semibold text-black transition-colors active:bg-zinc-100"
            >
              いいえ
            </button>
          </div>
        </div>
      )}

      {status === "ready" && (
        <button
          onClick={() => router.push("/menu")}
          className="rounded-full bg-black px-12 py-4 text-lg font-semibold text-white transition-colors active:bg-zinc-700"
        >
          Start
        </button>
      )}
    </div>
  );
}
