'use client'

// app/admin/dashboard/AdminTabsClient.tsx

import { useState } from 'react'
import AdminSalesTable from './AdminSalesTable'
import AdminAffiliatesTable from './AdminAffiliatesTable'
import AdminApplicationsTable from './AdminApplicationsTable'
import AdminCommissionsSection from './AdminCommissionsSection'
import AdminCardsSection from './AdminCardsSection'

type TabKey = 'sales' | 'cards' | 'affiliates' | 'commissions' | 'applications'

interface Props {
  initialTab: TabKey
  sales: any[]
  affiliates: any[]
  commissions: any[]
  withdrawals: any[]
  cards: any[]
  applications: any[]
  adminId: string
  tabBadges: Record<string, number>
}

export default function AdminTabsClient({
  initialTab,
  sales,
  affiliates,
  commissions,
  withdrawals,
  cards,
  applications,
  adminId,
  tabBadges,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  const tabs = [
    { key: 'sales' as TabKey,        label: 'Vendas',       emoji: '💳' },
    { key: 'cards' as TabKey,        label: 'Cartões',      emoji: null },
    { key: 'affiliates' as TabKey,   label: 'Afiliados',    emoji: '👥' },
    { key: 'commissions' as TabKey,  label: 'Comissões',    emoji: '💰' },
    { key: 'applications' as TabKey, label: 'Candidaturas', emoji: '📋' },
  ]

  return (
    <>
      {/* Tabs — sticky */}
      <div
        className="sticky top-0 z-10 -mx-4 px-4 pb-3 pt-1"
        style={{ background: 'var(--color-surface)' }}
      >
        <div
          className="flex gap-1 bg-white rounded-2xl p-1 border overflow-x-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {tabs.map(tab => {
            const badge = tabBadges[tab.key] || 0
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all relative"
                style={
                  activeTab === tab.key
                    ? { background: 'var(--color-primary)', color: 'white' }
                    : { color: '#6b7280' }
                }
              >
                {tab.emoji ? (
                  <span>{tab.emoji}</span>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                    <line x1="6" y1="15" x2="10" y2="15"/>
                  </svg>
                )}
                <span className="hidden sm:inline">{tab.label}</span>
                {badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-white flex items-center justify-center font-bold"
                    style={{ fontSize: 10, background: '#ef4444', padding: '0 4px' }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo das tabs — instantâneo, sem navegação */}
      {activeTab === 'sales' && (
        <AdminSalesTable sales={sales} adminId={adminId} />
      )}
      {activeTab === 'cards' && (
        <AdminCardsSection cards={cards} adminId={adminId} />
      )}
      {activeTab === 'affiliates' && (
        <AdminAffiliatesTable affiliates={affiliates} />
      )}
      {activeTab === 'commissions' && (
        <AdminCommissionsSection commissions={commissions} withdrawals={withdrawals} adminId={adminId} />
      )}
      {activeTab === 'applications' && (
        <AdminApplicationsTable applications={applications} />
      )}
    </>
  )
}
