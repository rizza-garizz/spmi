import { getRtmMeetings } from "@/lib/spmi-catalog-api";
import { CreateRtmMeetingForm } from "@/components/isian/rtm/create-rtm-meeting-form";
import { NilaiCardGrid } from "@/components/nilai/core";

export default async function RtmPage() {
  let meetings: any[] = [];
  try {
    meetings = (await getRtmMeetings()).data;
  } catch {
    meetings = [];
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-panel">
          <span className="eyebrow">Control</span>
          <h1>RTM & RTL</h1>
          <p className="hero-copy">
            Tempat mencatat keputusan rapat tinjauan manajemen dan memecahnya menjadi tindakan
            tindak lanjut per unit.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Agenda RTM</h2>
            <p>Daftar rapat membantu memetakan keputusan dan tindak lanjut dalam satu tempat.</p>
          </div>
          <div className="section-tag">Decision log</div>
        </div>
        <NilaiCardGrid
          columns={3}
          items={(meetings.length > 0 ? meetings : [{ title: "RTM semester ganjil", status: "draft" }]).map((meeting, index) => ({
            key: String(meeting.id ?? index),
            title: meeting.title,
            lines: [meeting.status ?? "-"],
          }))}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Tambah RTM</h2>
            <p>Form ini dipakai untuk menyiapkan agenda rapat baru dan tindak lanjutnya.</p>
          </div>
        </div>
        <CreateRtmMeetingForm initialItems={meetings} />
      </section>
    </main>
  );
}
