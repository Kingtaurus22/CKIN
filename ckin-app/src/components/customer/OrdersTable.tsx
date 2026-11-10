import Link from "next/link";
import { StatusPill } from "@/src/components/ui/common";
import { formatDate, formatRupiah } from "@/src/lib/format";
import type { CustomerOrderSummary } from "@/src/types/customer";

/** Aksi utama per baris, mengikuti Figma dashboard customer. */
export function orderAction(order: CustomerOrderSummary) {
  const detail = `/customer/orders/${order.id}`;
  switch (order.status) {
    case "PENDING_PAYMENT":
      return { label: "Bayar sekarang", href: detail };
    case "WAITING_SURVEYOR":
    case "ASSIGNED":
    case "IN_PROGRESS":
      return { label: "Lihat progres", href: detail };
    case "REPORT_SUBMITTED":
    case "COMPLETED":
      return { label: "Lihat laporan", href: `/customer/reports/${order.id}` };
    case "CANCELLED":
      return { label: "Lihat detail", href: detail };
    default:
      return { label: "Pesan ulang", href: "/customer/orders/new" };
  }
}

export default function OrdersTable({
  orders,
  loading,
  emptyText = "Belum ada pesanan pada kategori ini.",
}: {
  orders: CustomerOrderSummary[];
  loading?: boolean;
  emptyText?: string;
}) {
  return (
    <div className="table-wrap">
      <table className="table table-stack">
        <thead>
          <tr>
            <th>Pesanan / lokasi</th>
            <th>Jadwal survei</th>
            <th>Status</th>
            <th>Pembayaran</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 4 }).map((_, index) => (
              <tr key={`s-${index}`}>
                <td colSpan={5}>
                  <div className="skeleton" style={{ height: 30 }} />
                </td>
              </tr>
            ))}

          {!loading &&
            orders.map((order) => {
              const action = orderAction(order);
              return (
                <tr key={order.id}>
                  <td className="cell-main">
                    <div className="primary">
                      {order.location} · #{order.code}
                    </div>
                    <div className="meta">
                      {order.kosCount} kos · {order.surveyor?.name ?? "Menunggu surveyor"}
                    </div>
                  </td>
                  <td data-label="Jadwal survei">{formatDate(order.surveyDate)}</td>
                  <td data-label="Status">
                    <StatusPill tone={order.statusTone}>{order.statusLabel}</StatusPill>
                  </td>
                  <td data-label="Pembayaran"
                    className={
                      order.payment === "Sudah dibayar"
                        ? "paid"
                        : order.payment === "Dikembalikan"
                          ? "refund"
                          : ""
                    }
                  >
                    {order.status === "PENDING_PAYMENT" ? formatRupiah(order.total) : order.payment}
                  </td>
                  <td data-label="Aksi">
                    <Link className="table-action" href={action.href}>
                      {action.label} →
                    </Link>
                  </td>
                </tr>
              );
            })}

          {!loading && orders.length === 0 && (
            <tr>
              <td colSpan={5}>
                <div className="empty">{emptyText}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
