# @lobstrio/n8n-nodes-lobstr

This is an n8n community node for [lobstr.io](https://www.lobstr.io) — a cloud web scraping platform. It lets you run scrapers (squids), manage tasks and runs, fetch structured results, and trigger workflows when runs finish.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Credentials](#credentials)
[Operations](#operations)
[Trigger](#trigger)
[Example: scrape and get results](#example-scrape-and-get-results)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

For self-hosted n8n: **Settings → Community Nodes → Install**, then enter `@lobstrio/n8n-nodes-lobstr`.

## Credentials

1. Get your API key from the [API menu](https://app.lobstr.io/dashboard/api) in your lobstr.io dashboard.
2. In n8n, create new **lobstr.io API** credentials and paste the key.

The credential is verified against the lobstr.io API when you save it.

## Operations

### lobstr.io node

| Resource | Operations |
| --- | --- |
| **Crawler** | Get, Get Many, Get Parameters |
| **Squid** | Create, Delete, Empty, Get, Get Many, Update |
| **Task** | Create (add tasks), Delete, Get Many |
| **Run** | Abort, Get, Get Many, Start, Start and Get Results |
| **Result** | Get Results (by squid or by run) |
| **User** | Get Balance, Get Profile |

**Start and Get Results** starts a run, polls until it finishes, and outputs the scraped results as items — the simplest way to scrape synchronously inside a workflow. For long runs, prefer **Start** + the **lobstr.io Trigger** node.

## Trigger

The **lobstr.io Trigger** node starts a workflow when a squid run event occurs:

- `run.done` — run completed successfully
- `run.error` — run crashed with an error
- `run.paused` — run paused (e.g. account limits reached)
- `run.running` — run started or resumed

It uses lobstr.io [webhook delivery](https://docs.lobstr.io/docs/configure-webhook-delivery) under the hood. Note that activating the trigger replaces any webhook delivery previously configured on the selected squid.

## Example: scrape and get results

1. **lobstr.io → Squid → Create** — pick a crawler (e.g. Google Maps Search Export) and create a squid.
2. **lobstr.io → Task → Create** — add tasks (URLs or search parameters, depending on the crawler).
3. **lobstr.io → Run → Start and Get Results** — run the squid and get the scraped data as items.

Or, event-driven:

1. **lobstr.io Trigger** — select your squid and the `run.done` event.
2. **lobstr.io → Result → Get Results** — filter by run, using `{{ $json.id }}` from the trigger event.

## Compatibility

Requires n8n 1.57.0 or newer and Node.js 20.15 or newer. No runtime dependencies. Tested end-to-end against n8n 2.8.4.

## Resources

- [lobstr.io API documentation](https://docs.lobstr.io)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## Development

```
npm install
npm run build
npm run lint
```

To try the nodes locally, follow the [n8n node development guide](https://docs.n8n.io/integrations/creating-nodes/test/run-node-locally/).

## License

[MIT](LICENSE.md)
