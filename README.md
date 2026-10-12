# Uptime Monitor — site.gustavosantos.xyz

Um dashboard de monitoramento real para um único site: status ao vivo, latência, uptime % e histórico de incidentes — sem dados simulados.

![status](https://img.shields.io/badge/status-live-38bdf8) ![stack](https://img.shields.io/badge/stack-Next.js%20%2B%20TypeScript-black)

## O que faz

O servidor faz checagens HTTP reais contra `https://site.gustavosantos.xyz/` a cada ~20s (e sempre que a página é aberta, se a última checagem estiver desatualizada), mede status code e latência, e transmite os resultados ao vivo para o dashboard via Server-Sent Events.

- **Status ao vivo** — badge Online/Fora do ar atualizado em tempo real
- **Latência** — gráfico das últimas checagens, latência média
- **Uptime %** — calculado sobre o histórico de checagens retido em memória (a janela real de dados é mostrada explicitamente, já que o processo não persiste em disco)
- **Incidentes** — toda sequência de falhas vira um incidente com causa, duração e checagens falhas; some quando o site volta a responder
- **Verificar agora** — botão para forçar uma checagem imediata
- **Histórico** — log completo de checagens brutas (horário, status HTTP, latência, erro) e tabela de incidentes

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4**
- **Recharts** para o gráfico de latência
- **Server-Sent Events** nativo (`ReadableStream`) para o feed ao vivo
- Um monitor em memória no servidor (`src/lib/monitor.ts`) — sem banco de dados, sem serviços externos

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A primeira checagem real roda assim que o servidor sobe.

## Estrutura

```
src/
  lib/
    monitor.ts           # checagem HTTP real + histórico em memória + emissor de eventos
    stats.ts              # cálculo de uptime % e latência média (compartilhado client/server)
    store-context.tsx      # provider client-side: hidrata via /api/bootstrap, assina /api/stream
    types.ts                # CheckResult, Incident, MonitorSnapshot, MonitorEvent
  app/
    api/
      bootstrap/            # GET snapshot completo (checks, incidentes, uptime%, latência)
      stream/                 # GET Server-Sent Events do feed ao vivo
      check/                   # POST força uma checagem imediata
    page.tsx                   # Overview: status, uptime%, gráfico de latência, incidentes recentes
    history/                    # histórico completo de checagens + tabela de incidentes
```

## Limitações conhecidas

O histórico vive em memória no processo Node — em uma plataforma serverless (ex: Vercel), uma instância pode reiniciar e perder o histórico acumulado. Para uptime % confiável em janelas longas (7d/30d) em produção, o próximo passo seria persistir cada checagem em um banco (Postgres/Supabase) em vez de um array em memória.

## Alvo monitorado

A URL monitorada está fixa em `src/lib/monitor.ts` (`TARGET_URL`). Para monitorar outro endereço, basta trocar essa constante.
