type Props = {
  className?: string;
};

export function GovClerkDesktopMockup({ className }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 shadow-2xl bg-white${className ? ` ${className}` : ""}`}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2.5">
        <div className="flex shrink-0 gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-4 flex flex-1 items-center rounded-lg border border-gray-200 bg-white px-3 py-1">
          <svg
            className="mr-1.5 h-3 w-3 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-[11px] text-gray-500">govclerk.com/meetings</span>
        </div>
      </div>

      {/* App body */}
      <div className="flex h-[400px]">
        {/* Left sidebar */}
        <div className="flex w-52 shrink-0 flex-col bg-[#152a4e]">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1e40af] text-[10px] font-bold text-white">
                G
              </div>
              <span className="text-sm font-semibold text-white">GovClerk</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden space-y-0.5 px-2 py-2">
            <div className="px-2 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-wider text-white/40">
              Recent Meetings
            </div>
            {[
              { title: "City Council Regular Meeting", active: true },
              { title: "Budget Committee Session" },
              { title: "Project Launch Sync" },
              { title: "Weekly Standup" },
              { title: "Planning Commission" },
            ].map((m) => (
              <div
                key={m.title}
                className={`truncate rounded-lg px-2 py-2 text-[10px] ${
                  m.active ? "bg-white/15 text-white" : "text-white/50"
                }`}
              >
                {m.title}
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-white/10 p-3">
            <div className="rounded-lg bg-[#1e40af] py-1.5 text-center text-[10px] font-medium text-white">
              + New Transcription
            </div>
            <div className="flex items-center justify-between px-1 text-[9px] text-white/30">
              <span>Free plan</span>
              <span>3 credits left</span>
            </div>
          </div>
        </div>

        {/* Center panel — Transcript */}
        <div className="flex min-w-0 flex-1 flex-col border-r border-gray-100">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <div className="truncate text-xs font-semibold text-gray-800">
              City Council Regular Meeting
            </div>
            <div className="mt-0.5 text-[10px] text-gray-400">January 14, 2025</div>
          </div>
          <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-medium text-blue-600">Label Speakers</span>
            <div className="ml-auto flex gap-1">
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-600">
                Speaker 1
              </span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
                Speaker 2
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-hidden px-4 py-3">
            {[
              {
                sp: "1",
                time: "0:02",
                text: "I'd like to call this meeting to order. All council members are present.",
              },
              {
                sp: "2",
                time: "0:48",
                text: "The motion to approve last month's minutes is on the table.",
              },
              {
                sp: "1",
                time: "1:15",
                text: "We'll now proceed to the budget review presentation.",
              },
              {
                sp: "3",
                time: "2:30",
                text: "The proposed increase represents 4.2% over last year's allocation.",
              },
            ].map((msg, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#152a4e]/10 text-[9px] font-bold text-[#152a4e]">
                  S{msg.sp}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-700">
                      Speaker {msg.sp}
                    </span>
                    <span className="text-[9px] text-gray-400">{msg.time}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-gray-600">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Audio player */}
          <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50 px-4 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e40af]">
              <div className="ml-0.5 h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-white" />
            </div>
            <div className="h-1 flex-1 rounded-full bg-gray-200">
              <div className="h-1 w-1/3 rounded-full bg-[#1e40af]" />
            </div>
            <span className="shrink-0 text-[10px] text-gray-500">2:18 / 6:45</span>
          </div>
        </div>

        {/* Right panel — Minutes */}
        <div className="flex w-64 shrink-0 flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-xs font-semibold text-gray-700">Version 1</span>
            <button className="rounded-lg bg-[#1e40af] px-2.5 py-1 text-[10px] font-medium text-white">
              ↺ Regenerate
            </button>
          </div>
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2">
            {["H", "B", "I", "≡"].map((t) => (
              <div
                key={t}
                className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-500"
              >
                {t}
              </div>
            ))}
          </div>
          {/* Minutes content */}
          <div className="flex-1 space-y-2 overflow-hidden px-4 py-3">
            <p className="text-[11px] font-bold text-gray-800">
              City &amp; Chamber of Commerce 2x2 Meeting
            </p>
            <p className="text-[10px] text-gray-500">January 2025</p>
            <div className="pt-1">
              <p className="text-[10px] font-semibold text-gray-700">Committee Members</p>
              <div className="mt-1 space-y-0.5 text-[9px] text-gray-500">
                <div>• Speaker 1 — Chair</div>
                <div>• Speaker 2 — Vice Chair</div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-700">Staff</p>
              <div className="mt-1 space-y-0.5 text-[9px] text-gray-500">
                <div>• Speaker 3 — City Manager</div>
              </div>
            </div>
            <div>
              <p className="mt-2 text-[10px] font-semibold text-gray-700">
                Updates and Discussion Items
              </p>
              <div className="mt-1 space-y-1 text-[9px] text-gray-600">
                <p>
                  <span className="font-medium">Speaker 2:</span> Budget increase approved 5–2.
                </p>
                <p>
                  <span className="font-medium">Speaker 1:</span> Next meeting Feb 10th.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GovClerkMobileMockup({ className }: Props) {
  return (
    <div
      className={`mx-auto w-[200px] overflow-hidden rounded-[2rem] border-[6px] border-gray-800 bg-white shadow-2xl${className ? ` ${className}` : ""}`}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-1">
        <span className="text-[8px] font-medium text-white">9:41</span>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-3.5 rounded-sm bg-white/70" />
          <div className="h-2 w-1 rounded-sm bg-white/70" />
        </div>
      </div>

      {/* App header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <div>
          <p className="text-[9px] font-semibold text-gray-800">Chamber of Commerce…</p>
          <p className="text-[8px] text-gray-400">January 2025</p>
        </div>
        <span className="rounded bg-[#1e40af] px-2 py-0.5 text-[8px] font-medium text-white">
          Export
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {["Speakers", "Transcript", "Minutes"].map((tab) => (
          <div
            key={tab}
            className={`flex-1 py-1.5 text-center text-[8px] font-medium ${
              tab === "Minutes"
                ? "border-b-2 border-[#1e40af] text-[#1e40af]"
                : "text-gray-400"
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Rich text toolbar */}
      <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5">
        {["H", "B", "I", "≡"].map((t) => (
          <div
            key={t}
            className="flex h-4 w-4 items-center justify-center rounded bg-gray-100 text-[7px] font-bold text-gray-500"
          >
            {t}
          </div>
        ))}
        <div className="ml-auto rounded bg-[#1e40af] px-1.5 py-0.5 text-[7px] text-white">
          ↺ Regenerate
        </div>
      </div>

      {/* Minutes content */}
      <div className="space-y-1.5 px-3 py-2">
        <p className="text-[9px] font-bold text-gray-800">Updates and Discussion Items</p>
        <p className="text-[8px] leading-relaxed text-gray-600">
          <span className="font-medium text-[#1e40af]">Speaker 2:</span> Budget increase of 4.2%
          approved by vote.
        </p>
        <p className="text-[8px] leading-relaxed text-gray-600">
          <span className="font-medium text-[#1e40af]">Speaker 1:</span> Motion to approve meeting
          minutes carried.
        </p>
        <p className="text-[8px] leading-relaxed text-gray-600">
          <span className="font-medium text-[#1e40af]">Speaker 3:</span> Next session set for
          February 10, 2025.
        </p>
      </div>

      {/* Audio player */}
      <div className="mx-2 mb-2 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1e40af]">
          <div className="ml-0.5 h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white" />
        </div>
        <div className="h-0.5 flex-1 rounded-full bg-gray-200">
          <div className="h-0.5 w-2/5 rounded-full bg-[#1e40af]" />
        </div>
        <span className="text-[7px] text-gray-500">3:21</span>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-around border-t border-gray-100 px-2 py-2">
        <div className="flex flex-col items-center gap-0.5 text-gray-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[6px]">Home</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-gray-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="text-[6px]">Recordings</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e40af] shadow-md">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-gray-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[6px]">Templates</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-gray-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[6px]">Account</span>
        </div>
      </div>
    </div>
  );
}

export default GovClerkDesktopMockup;
