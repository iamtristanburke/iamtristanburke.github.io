export default function Home() {
  return (
    <div className="space-y-8">
      <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Welcome
        </h2>
        <p className="text-gray-300">
          This is the home page of my website.
        </p>
      </section>

      <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Featured Content
        </h2>
        <p className="text-gray-300 mb-4">
          <a 
            href="https://google.com" 
            className="text-blue-400 hover:text-blue-300 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            My great research
          </a>
        </p>
      </section>
    </div>
  )
}
