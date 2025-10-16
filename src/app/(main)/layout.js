import Header from '@/components/nav/Header'

export default function MainLayout({ children }) {
  return (
    <section className='max-h-screen overflow-hidden'>
      <Header />
      <div className='flex w-full overflow-y-scroll h-full px-5'>
          {children}
      </div>
    </section>
  )
}