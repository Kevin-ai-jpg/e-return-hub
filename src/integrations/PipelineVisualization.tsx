import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  PanelTop,
  Recycle,
  Ticket,
  Truck,
  User,
} from "lucide-react";

const steps = [
  {
    title: "Citizen selects DEEE",
    description: "User chooses fridge, phone, laptop, TV, or another device.",
    icon: User,
  },
  {
    title: "Offers Panel appears",
    description: "Collectors compete with voucher values, ratings, and speed.",
    icon: PanelTop,
  },
  {
    title: "Best offer selected",
    description: "Citizen picks the most attractive collector offer.",
    icon: CheckCircle2,
  },
  {
    title: "Collector confirms",
    description: "Pickup is completed and the collected weight is submitted.",
    icon: Truck,
  },
  {
    title: "Voucher generated",
    description: "n8n creates a voucher using the exact selected offer value.",
    icon: Ticket,
  },
  {
    title: "Stats update",
    description: "Dashboard updates county totals, CO₂ avoided, and progress.",
    icon: BarChart3,
  },
];

const offerCards = [
  {
    company: "EcoCollect",
    value: "160 lei",
    detail: "Tomorrow · Home pickup",
    rating: "4.2",
  },
  {
    company: "GreenTech",
    value: "140 lei",
    detail: "Today · Home pickup",
    rating: "4.8",
  },
  {
    company: "RecyclaPro",
    value: "120 lei",
    detail: "Drop-off · 0.8 km",
    rating: "4.9",
  },
];

export function PipelineVisualization() {
  const [activeStep, setActiveStep] = useState(0);
  const [collectionsCount, setCollectionsCount] = useState(283);
  const [kgCollected, setKgCollected] = useState(12635);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStep((current) => {
        const next = (current + 1) % steps.length;

        if (next === 5) {
          setCollectionsCount((value) => value + 1);
          setKgCollected((value) => value + 45);
        }

        if (next === 0) {
          setCollectionsCount(283);
          setKgCollected(12635);
        }

        return next;
      });
    }, 1400);

    return () => window.clearInterval(interval);
  }, []);

  const progressWidth = useMemo(() => {
    return `${((activeStep + 1) / steps.length) * 100}%`;
  }, [activeStep]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-green-900 to-green-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
              P4 Pipeline Visualization
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Citizen → Offers → Collector → Voucher → National Stats
            </h1>
            <p className="mt-2 max-w-3xl text-green-50">
              Animated demo flow showing how the e-Return marketplace connects
              citizens, collectors, vouchers, and the admin dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
            <Recycle size={32} />
            <div>
              <p className="text-sm text-green-100">Current demo step</p>
              <p className="font-bold">{activeStep + 1} / {steps.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-green-950">
              End-to-end system pipeline
            </h2>
            <p className="text-sm text-gray-600">
              Sequential highlights show the full hackathon demo story.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveStep(0)}
            className="rounded-xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-200"
          >
            Restart
          </button>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-green-100">
          <motion.div
            className="h-full rounded-full bg-green-600"
            animate={{ width: progressWidth }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;

            return (
              <div key={step.title} className="relative">
                <motion.div
                  animate={{
                    y: isActive ? -8 : 0,
                    scale: isActive ? 1.03 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className={[
                    "h-full rounded-2xl border p-4 shadow-sm transition",
                    isActive
                      ? "border-green-500 bg-green-50"
                      : isCompleted
                        ? "border-green-200 bg-white"
                        : "border-gray-100 bg-white",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl",
                      isActive
                        ? "bg-green-700 text-white"
                        : isCompleted
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    <Icon size={24} />
                  </div>

                  <p className="font-bold text-green-950">{step.title}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {step.description}
                  </p>
                </motion.div>

                {index < steps.length - 1 ? (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 xl:block">
                    <div className="rounded-full bg-white p-1 text-green-700 shadow-sm">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-bold text-green-950">
            Marketplace offers moment
          </h2>
          <p className="text-sm text-gray-600">
            The key differentiator: users compare real competing collector
            offers before confirming a pickup.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {offerCards.map((offer, index) => {
              const isHighlighted = activeStep === 1 || activeStep === 2;
              const isSelected = activeStep >= 2 && index === 0;

              return (
                <motion.div
                  key={offer.company}
                  animate={{
                    y: isHighlighted ? [0, -8, 0] : 0,
                    rotate: isHighlighted ? [-1, 1, 0] : 0,
                    scale: isSelected ? 1.05 : 1,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.12,
                  }}
                  className={[
                    "rounded-2xl border p-4 shadow-sm",
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-green-100 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-green-950">
                        {offer.company}
                      </p>
                      <p className="text-sm text-gray-600">⭐ {offer.rating}</p>
                    </div>

                    {isSelected ? (
                      <span className="rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white">
                        Selected
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-3xl font-bold text-green-800">
                    {offer.value}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{offer.detail}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-green-950">
            Live stats effect
          </h2>
          <p className="text-sm text-gray-600">
            When the collector confirms, the dashboard increments.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-sm text-gray-600">Confirmed collections</p>
              <motion.p
                key={collectionsCount}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className="mt-1 text-4xl font-bold text-green-900"
              >
                {collectionsCount}
              </motion.p>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-sm text-gray-600">Kg collected</p>
              <motion.p
                key={kgCollected}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className="mt-1 text-4xl font-bold text-green-900"
              >
                {kgCollected.toLocaleString()} kg
              </motion.p>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-sm text-gray-600">Voucher generated</p>
              <motion.p
                animate={{
                  opacity: activeStep >= 4 ? 1 : 0.35,
                  y: activeStep >= 4 ? 0 : 6,
                }}
                className="mt-1 text-3xl font-bold text-green-900"
              >
                160 lei
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}