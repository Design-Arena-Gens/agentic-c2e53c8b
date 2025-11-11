const DAY_MS = 24 * 60 * 60 * 1000;

interface Reminder {
  time: string;
  customer: string;
  car: string;
  pickupLocation: string;
}

interface BookingDay {
  dayOffset: number;
  dateISO: string;
  label: string;
  bookings: number;
  returns: number;
  newReservations: number;
  utilization: number;
  revenue: number;
  maintenance: number;
  status: "High Demand" | "On Track" | "Monitor";
  reminders: Reminder[];
}

function formatISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatLabel(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

function getStatus(utilization: number): BookingDay["status"] {
  if (utilization >= 0.85) return "High Demand";
  if (utilization >= 0.7) return "On Track";
  return "Monitor";
}

function buildReminders(dayOffset: number): Reminder[] {
  if (dayOffset !== 1) return [];

  return [
    {
      time: "08:00",
      customer: "Michelle Carter",
      car: "Tesla Model 3",
      pickupLocation: "Downtown Hub"
    },
    {
      time: "09:30",
      customer: "Rahul Sinha",
      car: "BMW X5",
      pickupLocation: "Airport Desk"
    },
    {
      time: "13:15",
      customer: "Laura Chen",
      car: "Toyota RAV4",
      pickupLocation: "Midtown Garage"
    }
  ];
}

function generateDailyBookings(): BookingDay[] {
  const today = new Date();
  const seeds = [
    { bookings: 22, returns: 18, newReservations: 14, utilization: 0.69, revenue: 3560, maintenance: 3 },
    { bookings: 27, returns: 17, newReservations: 10, utilization: 0.81, revenue: 4120, maintenance: 2 },
    { bookings: 24, returns: 19, newReservations: 9, utilization: 0.75, revenue: 3840, maintenance: 3 },
    { bookings: 29, returns: 21, newReservations: 12, utilization: 0.87, revenue: 4360, maintenance: 1 },
    { bookings: 31, returns: 18, newReservations: 16, utilization: 0.9, revenue: 4920, maintenance: 2 },
    { bookings: 26, returns: 20, newReservations: 11, utilization: 0.76, revenue: 4050, maintenance: 4 }
  ];

  const offsets = [-3, -2, -1, 0, 1, 2];

  return offsets.map((offset, index) => {
    const base = new Date(today.getTime() + offset * DAY_MS);
    const seed = seeds[index % seeds.length];

    return {
      dayOffset: offset,
      dateISO: formatISO(base),
      label: formatLabel(base),
      bookings: seed.bookings,
      returns: seed.returns,
      newReservations: seed.newReservations,
      utilization: seed.utilization,
      revenue: seed.revenue,
      maintenance: seed.maintenance,
      status: getStatus(seed.utilization),
      reminders: buildReminders(offset)
    } satisfies BookingDay;
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function computeMetrics(bookings: BookingDay[]) {
  const historic = bookings.filter((day) => day.dayOffset <= 0);
  const upcoming = bookings.filter((day) => day.dayOffset >= 0);
  const today = bookings.find((day) => day.dayOffset === 0);

  const totalHistoricBookings = historic.reduce((sum, day) => sum + day.bookings, 0);
  const averageUtilization =
    historic.reduce((sum, day) => sum + day.utilization, 0) / Math.max(historic.length, 1);
  const upcomingRevenue = upcoming.reduce((sum, day) => sum + day.revenue, 0);
  const activeFleet = Math.max(
    ...historic.map((day) => day.bookings + day.newReservations - day.returns)
  );

  return {
    todayBookings: today?.bookings ?? 0,
    totalHistoricBookings,
    averageUtilization,
    upcomingRevenue,
    activeFleet: Math.max(activeFleet, 32)
  };
}

export default function Page() {
  const bookings = generateDailyBookings();
  const nextDay = bookings.find((day) => day.dayOffset === 1);
  const metrics = computeMetrics(bookings);

  const timeline = nextDay
    ? [
        {
          title: "Morning Launch",
          items: [
            { label: "Keys prepped", value: `${nextDay.bookings} vehicles` },
            { label: "Detailing complete", value: `${nextDay.returns} returns processed` }
          ]
        },
        {
          title: "Midday Check-ins",
          items: [
            { label: "Walk-in slots", value: "3 remaining" },
            { label: "Maintenance holds", value: `${nextDay.maintenance} vehicles` }
          ]
        },
        {
          title: "Closing Tasks",
          items: [
            { label: "Contracts pending", value: `${nextDay.newReservations} to sign` },
            { label: "Charging bays", value: "All EVs staged" }
          ]
        }
      ]
    : [];

  return (
    <main>
      <div className="dashboard-shell">
        <header>
          <h1 className="section-title">Car Rental Command Center</h1>
          <p className="section-subtitle">
            Live visibility into fleet performance, booking cadence, and next-day readiness.
          </p>
        </header>

        <section className="metric-grid">
          <article className="metric-card">
            <span className="metric-label">Today&apos;s Bookings</span>
            <span className="metric-value">{metrics.todayBookings}</span>
            <small className="section-subtitle">Ready for pickup by 8am</small>
          </article>
          <article className="metric-card">
            <span className="metric-label">7-Day Booking Volume</span>
            <span className="metric-value">{metrics.totalHistoricBookings}</span>
            <small className="section-subtitle">Trending 6% higher vs last week</small>
          </article>
          <article className="metric-card">
            <span className="metric-label">Avg Utilization</span>
            <span className="metric-value">{formatPercent(metrics.averageUtilization)}</span>
            <small className="section-subtitle">Fleet health stays above target</small>
          </article>
          <article className="metric-card">
            <span className="metric-label">Projected Revenue</span>
            <span className="metric-value">{formatCurrency(metrics.upcomingRevenue)}</span>
            <small className="section-subtitle">Includes confirmed future reservations</small>
          </article>
        </section>

        {nextDay ? (
          <section className="reminder-card">
            <div>
              <strong>Tomorrow&apos;s Launch Plan — {nextDay.label}</strong>
              <p>{nextDay.bookings} confirmed pick-ups • {formatPercent(nextDay.utilization)} utilization forecast</p>
            </div>
            <div className="booking-list">
              {nextDay.reminders.map((reminder) => (
                <div key={reminder.time} className="booking-item">
                  <span>{reminder.time}</span>
                  <div>
                    {reminder.customer} — {reminder.car}
                    <div className="badge">{reminder.pickupLocation}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="empty-state">No upcoming reminders found.</p>
        )}

        <section>
          <header>
            <h2 className="section-title">Daily Booking Performance</h2>
            <p className="section-subtitle">Monitor utilization, returns, and revenue impact throughout the week.</p>
          </header>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bookings</th>
                  <th>Returns</th>
                  <th>New Reservations</th>
                  <th>Utilization</th>
                  <th>Maintenance</th>
                  <th>Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((day) => (
                  <tr key={day.dateISO}>
                    <td>{day.label}</td>
                    <td>{day.bookings}</td>
                    <td>{day.returns}</td>
                    <td>{day.newReservations}</td>
                    <td>{formatPercent(day.utilization)}</td>
                    <td>{day.maintenance}</td>
                    <td>{formatCurrency(day.revenue)}</td>
                    <td>
                      <span
                        className={`status-pill${
                          day.status === "High Demand"
                            ? " alert"
                            : day.status === "On Track"
                              ? " success"
                              : ""
                        }`}
                      >
                        {day.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {timeline.length > 0 && (
          <section>
            <header>
              <h2 className="section-title">Tomorrow&apos;s Timeline</h2>
              <p className="section-subtitle">
                Ensure every handoff is covered with a clear runbook for the next operational day.
              </p>
            </header>
            <div className="timeline">
              {timeline.map((block) => (
                <article key={block.title} className="timeline-card">
                  <h3>{block.title}</h3>
                  <ul>
                    {block.items.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
