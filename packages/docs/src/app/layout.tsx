import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  title: {
    template: '%s - Kwala AI',
    default: 'Kwala AI',
  },
  description:
    'Kwala AI — MCP server for blockchain automation on Kwala Network. 20 tools for AI agents.',
  applicationName: 'Kwala AI',
}

const logo = (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
    >
      <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" stroke="#a855f7" strokeWidth="1.8" fill="none"/>
      <circle cx="16" cy="12" r="3" fill="#a855f7"/>
      <path d="M10 20 L16 16 L22 20" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="10" cy="20" r="1.5" fill="#a855f7"/>
      <circle cx="22" cy="20" r="1.5" fill="#a855f7"/>
    </svg>
    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Kwala AI</span>
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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
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
              {`\u00A9 ${new Date().getFullYear()} Kwala AI \u2014 Blockchain automation powered by AI`}
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
