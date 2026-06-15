export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
      <div className="grid min-h-[420px] grid-cols-[180px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-[#f7f8fc] p-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-[0.62rem] uppercase  text-slate-500">CRM</div>
            <div className="display-title text-sm text-slate-900">KAHIER</div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">Accueil</div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">Finance</div>
          </div>

          <div className="mt-4 text-[0.62rem] uppercase  text-slate-400">Commercial</div>
          <div className="mt-2 space-y-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">Clients</div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">Projets</div>
          </div>
        </aside>

        <div className="bg-[#f3f4fa]">
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Bonjour, Mathéo.</div>
                <div className="text-xs text-slate-500">mardi 28 avr., 09:42</div>
              </div>
              <div className="rounded-full border border-slate-200 bg-[#f7f8fc] px-2.5 py-1 text-[0.62rem] font-medium uppercase  text-slate-500">
                Aperçu du dashboard
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px]">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Performance d'équipe</div>
                  <div className="text-[0.65rem] text-slate-500">30 derniers jours</div>
                </div>
                <div className="flex h-28 items-end gap-2">
                  <div className="w-5 rounded-t-md bg-teal-500" style={{ height: "85%" }} />
                  <div className="w-5 rounded-t-md bg-teal-500" style={{ height: "26%" }} />
                  <div className="w-5 rounded-t-md bg-teal-500" style={{ height: "44%" }} />
                  <div className="w-5 rounded-t-md bg-teal-500" style={{ height: "62%" }} />
                  <div className="w-5 rounded-t-md bg-teal-500" style={{ height: "36%" }} />
                  <div className="w-5 rounded-t-md bg-teal-500" style={{ height: "58%" }} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[0.62rem] uppercase  text-slate-500">Projets</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">2</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[0.62rem] uppercase  text-slate-500">Interactions</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">8</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[0.62rem] uppercase  text-slate-500">Clients actifs</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">1</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[0.62rem] uppercase  text-slate-500">Prospects</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">0</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[0.62rem] uppercase  text-slate-500">Conversion</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">100%</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[0.62rem] uppercase  text-slate-500">Projets suivis</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">2</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
