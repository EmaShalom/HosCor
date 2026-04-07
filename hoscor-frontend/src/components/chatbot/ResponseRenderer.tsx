import { AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChatbotResponse, GuideResponse } from '../../types/chatbot'
import type { Stretcher } from '../../types'
import GuideCard from './GuideCard'
import ActionConfirmCard from './ActionConfirmCard'
import PatientRow from '../common/PatientRow'

interface Props {
  response: ChatbotResponse
  onRelatedClick: (question: string) => void
  onConfirmAction: (actionType: string, params: Record<string, unknown>) => void
  onCancelAction: () => void
}

export default function ResponseRenderer({
  response,
  onRelatedClick,
  onConfirmAction,
  onCancelAction,
}: Props) {
  switch (response.type) {
    case 'TEXT':
      return <p className="text-sm text-gray-700 leading-relaxed">{response.message}</p>

    case 'METRIC': {
      const raw = response.data
      // Backend can send either an array [{label, value}] or a plain object {key: value}
      const metricItems: { label: string; value: string }[] = Array.isArray(raw)
        ? (raw as Record<string, unknown>[]).map(m => ({
            label: String(m.label ?? ''),
            value: String(m.value ?? ''),
          }))
        : raw && typeof raw === 'object'
        ? Object.entries(raw as Record<string, unknown>)
            .filter(([, v]) => v !== null && typeof v !== 'object')
            .map(([k, v]) => ({ label: k, value: String(v) }))
        : []
      return (
        <div>
          <p className="text-sm text-gray-700 mb-2">{response.message}</p>
          {metricItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {metricItems.map((m, i) => (
                <div key={i} className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-lg font-bold text-brand">{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'TABLE': {
      const raw = response.data as Record<string, unknown> | null
      const headers = Array.isArray(raw?.headers) ? (raw!.headers as string[]) : []
      const rows = Array.isArray(raw?.rows) ? (raw!.rows as (string | number)[][]) : []

      // Fallback: if the backend sent a list of plain objects, auto-generate headers from keys
      const objectList = !raw?.headers && Array.isArray(raw)
        ? (raw as Record<string, unknown>[])
        : null
      const autoHeaders = objectList ? Object.keys(objectList[0] ?? {}) : headers
      const autoRows = objectList
        ? objectList.map(obj => autoHeaders.map(k => String(obj[k] ?? '')))
        : rows

      if (autoHeaders.length === 0 && autoRows.length === 0) {
        return <p className="text-sm text-gray-700">{response.message}</p>
      }

      return (
        <div>
          <p className="text-sm text-gray-700 mb-2">{response.message}</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {autoHeaders.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left text-gray-600 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {autoRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    case 'ALERT': {
      const isCritical = (response.data as { severity?: string })?.severity === 'CRITICAL'
      return (
        <div className={`rounded-lg p-3 flex items-start gap-2 ${isCritical ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
          <AlertTriangle size={16} className={isCritical ? 'text-red-500' : 'text-orange-500'} />
          <p className={`text-sm ${isCritical ? 'text-red-800' : 'text-orange-800'}`}>
            {response.message}
          </p>
        </div>
      )
    }

    case 'PATIENT_CARDS': {
      const raw = response.data
      if (!raw || !Array.isArray(raw) || raw.length === 0) {
        return <p className="text-sm text-gray-700">{response.message}</p>
      }

      // Backend sends flat objects from SQL — shapes vary by service:
      //   PatientFlowService:       { stretcherNumber, riskLevel, waitSince, firstName, lastName, age, mrdNumber, waitMinutes, ... }
      //   DecisionEngine overdue:   { stretcherNumber, riskLevel, waitSince, firstName, lastName, diagnosis, waitMin (no mrdNumber) }
      //   DecisionEngine deterioration: { firstName, lastName, age, diagnosis, unit, riskScore, reasons (no stretcher fields) }
      // PatientRow expects a nested Stretcher { patient: { firstName, ... } }
      const stretchers: Stretcher[] = (raw as Record<string, unknown>[]).map((item, idx) => {
        // Already a proper Stretcher (nested patient object present)
        if (item.patient && typeof item.patient === 'object') {
          return item as unknown as Stretcher
        }

        // Infer riskLevel from riskScore if riskLevel is missing (deterioration shape)
        const riskScore = Number(item.riskScore ?? 0)
        const inferredRisk: Stretcher['riskLevel'] =
          item.riskLevel ? (String(item.riskLevel) as Stretcher['riskLevel'])
          : riskScore >= 60 ? 'ELEVE'
          : riskScore >= 30 ? 'MOYEN'
          : 'FAIBLE'

        // waitMinutes: field is "waitMinutes" in PatientFlow, "waitMin" in overdue query
        const waitMins = Number(item.waitMinutes ?? item.waitMin ?? 0)

        // waitSince: fall back to now if absent (deterioration shape has no waitSince)
        const waitSince =
          item.waitSince && String(item.waitSince) !== 'null'
            ? String(item.waitSince)
            : new Date(Date.now() - waitMins * 60000).toISOString()

        // targetUnit: could come from targetUnit or unit field
        const targetUnit = item.targetUnit ?? item.unit

        return {
          id: idx,
          stretcherNumber: String(item.stretcherNumber ?? `—`),
          status: 'WAITING' as const,
          riskLevel: inferredRisk,
          waitSince,
          targetUnit: targetUnit ? String(targetUnit) : undefined,
          waitMinutes: waitMins,
          priorityScore: Number(item.priorityScore ?? riskScore),
          patient: {
            id: idx,
            firstName: String(item.firstName ?? ''),
            lastName: String(item.lastName ?? ''),
            age: Number(item.age ?? 0),
            gender: String(item.gender ?? ''),
            diagnosis: String(item.diagnosis ?? ''),
            mrdNumber: String(item.mrdNumber ?? '—'),
            status: 'ADMITTED' as const,
            unit: targetUnit ? String(targetUnit) : undefined,
            bedNumber: undefined,
            admissionDate: waitSince,
            dischargeDate: undefined,
            dischargeReason: undefined,
          },
        }
      })

      return (
        <div>
          <p className="text-sm text-gray-700 mb-2">{response.message}</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs text-gray-600 font-semibold">Civière</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-600 font-semibold">Patient</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-600 font-semibold">Âge</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-600 font-semibold">Diagnostic</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-600 font-semibold">Risque</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-600 font-semibold">Attente</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-600 font-semibold">Unité cible</th>
                </tr>
              </thead>
              <tbody>
                {stretchers.map((s, i) => <PatientRow key={s.id ?? i} stretcher={s} />)}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    case 'CHART_DATA': {
      const raw = response.data
      // Backend can send either:
      //   wrapped: { type, data: [...], nameKey, dataKey }
      //   raw list: [{ day: "...", admissions: 5 }, ...]
      const isList = Array.isArray(raw)
      const chartList: Record<string, unknown>[] = isList
        ? (raw as Record<string, unknown>[])
        : ((raw as Record<string, unknown>)?.data as Record<string, unknown>[]) ?? []
      const chartMeta = isList ? {} : (raw as Record<string, unknown>)
      const isLine = chartMeta.type === 'line'

      // Auto-detect axis keys from first item if not specified
      const firstItem = chartList[0] ?? {}
      const keys = Object.keys(firstItem)
      const nameKey = String(chartMeta.nameKey ?? keys[0] ?? 'name')
      const dataKey = String(chartMeta.dataKey ?? keys[1] ?? 'value')

      return (
        <div>
          <p className="text-sm text-gray-700 mb-2">{response.message}</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              {isLine ? (
                <LineChart data={chartList}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey={dataKey} stroke="#2563EB" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={chartList}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey={dataKey} fill="#2563EB" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )
    }

    case 'ACTION_CONFIRM':
      return (
        <ActionConfirmCard
          actionType={response.actionType ?? ''}
          params={response.params ?? {}}
          summary={response.summary ?? response.message}
          onConfirm={() => onConfirmAction(response.actionType ?? '', response.params ?? {})}
          onCancel={onCancelAction}
        />
      )

    case 'GUIDE':
      return (
        <div>
          <p className="text-sm text-gray-700 mb-1">{response.message}</p>
          <GuideCard guide={response.data as GuideResponse} onRelatedClick={onRelatedClick} />
        </div>
      )

    default:
      return <p className="text-sm text-gray-700">{response.message}</p>
  }
}
