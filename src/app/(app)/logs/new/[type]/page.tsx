import NewLogPage from './new-log-page'

export const dynamicParams = false

export function generateStaticParams() {
  return ['food', 'workout', 'water', 'weight', 'mood', 'sleep', 'energy'].map((type) => ({ type }))
}

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  return <NewLogPage type={type} />
}
