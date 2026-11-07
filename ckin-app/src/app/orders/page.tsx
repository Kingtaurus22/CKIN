
import Sidebar from "@/src/components/Sidebar";
import Header from "@/src/components/Header";

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <Header />

        <section className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Pesanan saya
          </h1>
        </section>
      </main>
    </div>
  );
}
