import Header from '@/components/nav/Header'

export default function MainLayout({ children }) {
  return (
    <section className='max-h-screen'>
      <Header />
      <main className='md:container md:mx-auto'>
          {children}
      </main>
    </section>
  )
}