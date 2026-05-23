import { QRCodeCanvas } from "qrcode.react";

type PickupQRCodeProps = {
  pickupRequestId?: string;
  collectorName?: string;
  deeeType?: string;
  voucherValueLei?: number;
  status?: string;
};

export function PickupQRCode({
  pickupRequestId = "pickup-demo-001",
  collectorName = "EcoCollect",
  deeeType = "fridge",
  voucherValueLei = 160,
  status = "scheduled",
}: PickupQRCodeProps) {
  const qrPayload = JSON.stringify({
    pickupRequestId,
    collectorName,
    deeeType,
    voucherValueLei,
    status,
  });

  return (
    <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-green-900">Pickup QR Code</h2>
        <p className="text-sm text-gray-600">
          Demo QR for collector pickup confirmation.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-green-50 p-6">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <QRCodeCanvas value={qrPayload} size={180} includeMargin />
        </div>

        <div className="text-center">
          <p className="font-semibold text-green-900">{collectorName}</p>
          <p className="text-sm text-gray-600">
            {deeeType} · {voucherValueLei} lei · {status}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            ID: {pickupRequestId}
          </p>
        </div>
      </div>
    </section>
  );
}