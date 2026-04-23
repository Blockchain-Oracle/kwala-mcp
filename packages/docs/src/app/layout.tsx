import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import './globals.css'

export const metadata = {
  title: {
    template: '%s - Kwala MCP',
    default: 'Kwala MCP Docs',
  },
  description:
    'Kwala MCP — AI-powered blockchain automation. MCP server + CLI for generating, deploying, and monitoring Kwalang workflows across 11 EVM chains.',
  applicationName: 'Kwala MCP',
}

const logo = (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#10b981" strokeWidth="2" fill="none" />
      <path d="M10 10 L10 22 M10 16 L22 10 M10 16 L22 22" stroke="#10b981" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Kwala MCP</span>
  </div>
)

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pageMap = await getPageMap()

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
        <Layout
          navbar={
            <Navbar
              logo={logo}
              projectLink="https://github.com/Blockchain-Oracle/kwala-mcp"
            />
          }
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/Blockchain-Oracle/kwala-mcp/tree/main/packages/docs"
          editLink="Edit this page on GitHub"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          footer={
            <Footer>
              {`© ${new Date().getFullYear()} Kwala MCP — AI-powered blockchain automation`}
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
