
import Header from "@/src/components/Header";
import Sidebar from "@/src/components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <section className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Dashboard
          </h1>
        </section>
      </main>
    </div>
  );
}
