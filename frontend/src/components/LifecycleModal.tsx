import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Trash2, Loader2 } from 'lucide-react'
import { bucketsApi } from '@/services/buckets'

interface LifecycleRule {
  id: string
  status: string
  prefix: string | null
  expiration_days: number | null
  noncurrent_days: number
}

interface LifecycleModalProps {
  bucketName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LifecycleModal({
  bucketName,
  open,
  onOpenChange,
}: LifecycleModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [rules, setRules] = useState<LifecycleRule[]>([])

  const loadLifecycle = async () => {
    try {
      setLoading(true)
      const data = await bucketsApi.getLifecycle(bucketName)
      console.log(data)
      if (data && data.Rules && data.Rules.length > 0) {
        setEnabled(true)
        const mappedRules: LifecycleRule[] = data.Rules.map((rule: any, index: number) => ({
          id: rule.ID || `rule-${index}`,
          status: rule.Status || 'Enabled',
          prefix: rule.Prefix || '',
          expiration_days: rule.Expiration?.Days || 0,
          noncurrent_days: rule.NoncurrentVersionExpiration.NoncurrentDays

        }))
        setRules(mappedRules)
      } else {
        setEnabled(false)
        setRules([])
      }
    } catch {
      // Erro ao carregar (pode não ter configuração ainda)
      setEnabled(false)
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadLifecycle()
    }
  }, [open, bucketName])

  const addRule = () => {
    const newRule: LifecycleRule = {
      id: `rule-${Date.now()}`,
      status: 'Enabled',
      prefix: '',
      expiration_days: null,
      noncurrent_days: 7,
    }
    setRules([...rules, newRule])
    setEnabled(true)
  }

  const removeRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index)
    setRules(updated)
    if (updated.length === 0) {
      setEnabled(false)
    }
  }

  const updateRule = (index: number, field: keyof LifecycleRule, value: string | number) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], [field]: value }
    setRules(updated)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      if (enabled && rules.length > 0) {
        await bucketsApi.updateLifecycle(bucketName, rules)
      } else {
        await bucketsApi.deleteLifecycle(bucketName)
      }
      alert('Configuração de lifecycle salva com sucesso!')
      onOpenChange(false)
    } catch (err) {
      alert(`Erro ao salvar lifecycle: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lifecycle Configuration
          </DialogTitle>
          <DialogDescription>
            Gerencie as regras de lifecycle do bucket {bucketName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Enable/Disable toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => {
                    setEnabled(e.target.checked)
                    if (!e.target.checked) {
                      setRules([])
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Ativar Lifecycle</span>
              </label>

              {enabled && (
                <>
                  {/* Rules */}
                  <div className="space-y-3">
                    {rules.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma regra configurada. Adicione uma regra abaixo.
                      </p>
                    )}

                    {rules.map((rule, index) => (
                      <div key={index} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Regra {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRule(index)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>Prefixo</Label>
                            <Input
                              value={rule.prefix ?? ""}
                              onChange={(e) => updateRule(index, 'prefix', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label>Dias a  manter versões antigas</Label>
                            <Input
                              type="number"
                              min={1}
                              value={rule.noncurrent_days || 0}
                              onChange={(e) => updateRule(index, 'noncurrent_days', parseInt(e.target.value) || 0)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label>Dias a Expirar versões atuais</Label>
                            <Input
                              type="number"
                              min={1}
                              value={rule.expiration_days || 0}
                              onChange={(e) => updateRule(index, 'expiration_days', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label>Status</Label>
                          <select
                            value={rule.status}
                            onChange={(e) => updateRule(index, 'status', e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="Enabled">Ativo</option>
                            <option value="Disabled">Inativo</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" onClick={addRule} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Regra
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}