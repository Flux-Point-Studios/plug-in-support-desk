---

## 1  Company Profile

| Item                 | Details                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Legal Name**       | **SpectrumLink Support Services, Inc.**                                                                                                                                                                   |
| **Headquarters**     | 2255 Meridian Way, Plano, TX 75024, USA                                                                                                                                                                   |
| **Year Founded**     | 2025                                                                                                                                                                                                      |
| **Business Type**    | Tier‑2 managed service provider (MSP) specializing in end‑user and enterprise support for cellular handsets, data hotspots, and IoT/M2M connectivity.                                                     |
| **Primary Markets**  | Continental United States & Canada (roaming partnerships in the EU and APAC).                                                                                                                             |
| **Support Channels** | • Toll‑free voice: +1‑888‑SLS‑CARE  • 24/7 chat (portal & mobile app) • Email/ticket: [support@spectrumlink.com](mailto:support@spectrumlink.com) • API webhooks (for enterprise/IoT incident automation) |
| **Core Services**    | Device provisioning, rate‑plan activation, network diagnostics, firmware lifecycle mgmt., enterprise APN/VPN design, field‑deployable cellular WAN solutions.                                             |

### 1.1 Mission Statement

> *“To keep people and machines reliably connected—anywhere, any time—by delivering human‑centric, technically excellent cellular support.”*

### 1.2 Vision

> *“A world where wireless connectivity is seamless, sustainable, and secure for every person, product, and process.”*

### 1.3 Values

1. **Customer Empathy** – resolve the *why* behind every ticket.
2. **Technical Mastery** – invest 10 % of staff hours in training and labs.
3. **Integrity & Compliance** – zero tolerance for privacy lapses.
4. **Green Operations** – e‑waste recycling, net‑zero data‑center pledge by 2030.
5. **Collaboration** – knowledge‑base articles are public‑by‑default.

---

## 2  Operating Hours & Holiday Schedule

| Support Tier                      | Coverage Window     | Time‑Zone Base | Notes                                            |
| --------------------------------- | ------------------- | -------------- | ------------------------------------------------ |
| **Tier 0 (Self‑Service Portal)**  | 24 × 7 × 365        | N/A            | KB, chat‑bot, status page                        |
| **Tier 1 (Voice & Chat)**         | Mon–Fri 06:00‑21:00 | U.S. Central   | After‑hours auto‑attendant creates P1/P2 tickets |
| **Tier 2 (Enterprise / IoT NOC)** | 24 × 7              | U.S. Central   | On‑call escalation roster                        |
| **Tier 3 (Engineering)**          | Mon–Fri 08:00‑18:00 | U.S. Central   | P1 incidents escalated 24/7                      |

### Holidays Observed (Phones to ring Tier 2 only)

| Date (2025) | Holiday                                  |
| ----------- | ---------------------------------------- |
| Jan 1       | New Year’s Day                           |
| Jan 20      | Martin Luther King Jr. Day               |
| May 26      | Memorial Day                             |
| Jul 4       | Independence Day                         |
| Sep 1       | Labor Day                                |
| Nov 27–28   | Thanksgiving & Day After                 |
| Dec 24–25   | Christmas Eve & Day                      |
| Dec 31      | New Year’s Eve (Tier 1 06:00‑12:00 only) |

---

## 3  Device Technical Reference

> **Firmware:** All devices are shipped on the minimum version shown; customers are encouraged to stay current.
> **Bands:** “NR”=5 G, “LTE”=4 G.

### 3.1 Smartphones

| Model             | OS / Firmware              | Cellular Bands                 | Key Features                              | Compatible Plans                |
| ----------------- | -------------------------- | ------------------------------ | ----------------------------------------- | ------------------------------- |
| **Volt One**      | Android 14 build A14.3.2   | NR n66/n77/n258, LTE 2/4/12/66 | eSIM, VoLTE, Wi‑Fi 6E, Hotspot 30 devices | All except *IoT Flex*           |
| **Volt One Pro**  | Android 14 build A14.3.5‑P | Same as Volt One + NR n260     | mmWave, dual‑eSIM, 120 Hz OLED            | All except *IoT Flex*           |
| **Volt One Lite** | Android 13 build A13.9     | LTE 2/4/12/66 only             | Single SIM, VoLTE, 2.4 GHz Wi‑Fi 5        | *Essential Phone*, *Basic T\&T* |

#### Provisioning Cheat‑Sheet

| Step                     | CLI / UI Path                        | Value                                 |
| ------------------------ | ------------------------------------ | ------------------------------------- |
| Insert SIM / assign eSIM | Settings ▶ Network & Internet ▶ SIMs | ICCID must appear in OSS within 60 s  |
| APN selection            | Default: `slcore.lte`                | Enterprise VPN plans use `slcorp.apn` |
| VoLTE toggle             | Enabled by default                   | If disabled → no HD voice             |

---

### 3.2 Data‑Only Hotspots

| Model              | Bands                      | Wi‑Fi Spec | Battery          | Firmware  | Compatible Plans                                                 |
| ------------------ | -------------------------- | ---------- | ---------------- | --------- | ---------------------------------------------------------------- |
| **AirWave 300**    | LTE 2/4/12/66              | Wi‑Fi 5    | 4 000 mAh ≈ 10 h | v2.2.1    | *DataConnect 10 GB*, *DataConnect Unlimited*                     |
| **AirWave 600 5G** | NR n77/n258 + LTE fallback | Wi‑Fi 6    | 5 000 mAh ≈ 9 h  | v3.0.0‑5G | *DataConnect Unlimited*, *Unlimited Plus* (tethering cap 100 GB) |

---

### 3.3 IoT / M2M

| Device                          | Use‑Case                                      | Bands                     | Interfaces                      | HW / FW          | Compatible Plans                            |
| ------------------------------- | --------------------------------------------- | ------------------------- | ------------------------------- | ---------------- | ------------------------------------------- |
| **DriveSense V2 Smart‑Car OBD** | Vehicle telemetry & CAN‑bus alerts            | LTE Cat‑M1 + NB‑IoT       | BLE 5, GNSS, CAN‑pass‑through   | Rev B / fw 1.7   | *IoT Flex*, *DataConnect 10 GB*             |
| **LinkEdge R500 Rugged Router** | Branch/fleet connectivity (Cradlepoint‑class) | NR n66/n77, LTE 2/4/12/66 | 4×GbE, 1×SFP, dual‑SIM, Wi‑Fi 6 | hw v1.1 / fw 2.6 | *Unlimited Plus*, *IoT Flex* (speed‐capped) |

---

## 4  Service Plans

| Plan Name                 | Monthly Price   | Included Data / Talk                      | Throughput\*         | Throttle / Deprioritize         | Eligible Devices                                        |
| ------------------------- | --------------- | ----------------------------------------- | -------------------- | ------------------------------- | ------------------------------------------------------- |
| **Basic Talk & Text**     | \$20            | Unlimited voice & SMS, **no data**        | N/A                  | N/A                             | Volt One Lite                                           |
| **Essential Phone**       | \$45            | 10 GB high‑speed + unlimited voice/SMS    | 5 G / LTE full       | 128 kbps after 10 GB            | All phones                                              |
| **Unlimited Plus**        | \$70            | Unlimited; 50 GB priority, 100 GB hotspot | Up to 1 Gbit/s 5 G   | Deprioritize after 50 GB        | Volt One / Pro, AirWave 600, LinkEdge                   |
| **DataConnect 10 GB**     | \$25            | 10 GB pooled (data‑only)                  | 150 Mbit/s LTE       | Block after cap (top‑ups avail) | AirWave 300, DriveSense                                 |
| **DataConnect Unlimited** | \$55            | Unlimited; 30 GB priority                 | 5 G up to 700 Mbit/s | 512 kbps after 30 GB            | AirWave 300/600                                         |
| **IoT Flex**              | \$5 + \$0.40/MB | PAYG metered; SMS optional                | 1 Mbit/s cap         | None; billed per MB             | DriveSense, LinkEdge (speed cap), low‑bandwidth sensors |

\* Maximum achievable under ideal RF & backhaul.

### 4.1 Compatibility Matrix (excerpt)

| Device → / Plan ↓ | Basic T\&T | Essential Phone | Unlimited Plus | DataConnect 10 GB | DataConnect Unlimited | IoT Flex |
| ----------------- | ---------- | --------------- | -------------- | ----------------- | --------------------- | -------- |
| Volt One Lite     | ✔          | ✔               | ✖ (no VoNR)    | ✖                 | ✖                     | ✖        |
| Volt One / Pro    | ✖          | ✔               | ✔              | ✖                 | ✖                     | ✖        |
| AirWave 300       | ✖          | ✖               | ✖              | ✔                 | ✔                     | ✖        |
| AirWave 600 5G    | ✖          | ✖               | ✔\*            | ✖                 | ✔                     | ✖        |
| DriveSense V2     | ✖          | ✖               | ✖              | ✔                 | ✖                     | ✔        |
| LinkEdge R500     | ✖          | ✖               | ✔              | ✖                 | ✖                     | ✔\*      |

\* Operational but with stated hotspot or speed caps.

---

## 5  Detailed Device Workflows

### 5.1 Volt One (Pro/Lite) Activation

1. Insert SpectrumLink SIM → device auto‑detects APN.
2. Dial `*228` to push initial PRL & VoLTE token.
3. Verify IMS registration in *Settings ▶ About ▶ SIM status* (“IMS: registered”).
4. Run *SpectrumLink Device Health* app (pre‑loaded) → performs OTA firmware check and network attach test.
5. Ticket escalation triggers if last step > 120 s.

### 5.2 AirWave Hotspots

* Default admin UI `http://192.168.0.1` / password: last 8 digits of IMEI.
* Hidden field‐test mode: press **Menu** 5 × + **Power**. Returns cell ID, RSRP, SINR.
* Data‑usage counter resets 00:00 UTC on bill cycle day; user cannot zero it manually (prevents abuse).

### 5.3 DriveSense Smart‑Car

* eUICC bootstrap profile → auto‑downloads operational IMSI after first GPS fix.
* Sends MQTT heartbeat every 60 sec (topic `vin/<VIN>/heartbeat`).
* If three consecutive heartbeats missed, NOC alert severity = “Minor.”

### 5.4 LinkEdge R500

* Dual‑SIM failover supported; default watchdog pings `8.8.8.8` every 15 s.
* Enterprise customers may request a private APN with IPSec & RADIUS auth.
* Firmware 2.6 adds **Zero‑Touch Provisioning (ZTP)**—upload `ztp.cfg` to SpectrumLink portal, ship router un‑touched.

---

## 6  FAQ (Front‑Line Quick Reference)

| #  | Question                                     | Short Answer                                                                    |
| -- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| 1  | **How do I check my data usage?**            | Dial **`*3282#`** or open *MySpectrumLink* app Dashboard.                       |
| 2  | **Why is my speed slow after 50 GB?**        | You hit the priority threshold; network may deprioritize you during congestion. |
| 3  | **Do you support international roaming?**    | Yes on Essential & Unlimited Plus (Canada/Mexico free; others \$10/day).        |
| 4  | **Can I bring my unlocked iPhone?**          | Not yet—only the Volt series is certified. BYOD launches Q4 2025.               |
| 5  | **What SIM size do hotspots use?**           | 3FF (micro‑SIM) with adapter included; eSIM not supported.                      |
| 6  | **Does IoT Flex include SMS?**               | Optional add‑on \$0.01/SMS MT, \$0.02/MO.                                       |
| 7  | **How do I reset AirWave admin password?**   | Hold **WPS** + **Power** 10 s → factory reset (data wiped).                     |
| 8  | **What is the warranty period?**             | 24 months on phones & hotspots, 36 months on LinkEdge; RMA via portal.          |
| 9  | **Can I pause my plan while traveling?**     | Suspend once per 12 months; \$5/month retain‑number fee.                        |
| 10 | **Is 5 G mmWave extra?**                     | No surcharge; available only on Volt One Pro in select metros.                  |
| 11 | **Does tethering count against my plan?**    | Yes. On Unlimited Plus, hotspot is capped at 100 GB.                            |
| 12 | **How do I unlock bootloader?**              | Dev tier only. Submit IMEI and NDA; voids warranty.                             |
| 13 | **Can LinkEdge receive a public static IP?** | Yes, \$7/month on Unlimited Plus or IoT Flex.                                   |
| 14 | **Are VPNs blocked?**                        | All consumer plans allow IPSec & WireGuard; IoT Flex requires enterprise APN.   |
| 15 | **What happens at firmware EOL?**            | Device barred from network 90 days after EOL notice if not updated.             |

---

## 7  Known Issues & Workarounds

| ID          | Affected Item             | Symptom                                                             | Root Cause / Status                                         | Workaround / ETA                                   |                   |
| ----------- | ------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- | ----------------- |
| KI‑2025‑001 | Volt One Lite (fw A13.9)  | Random VoLTE drops when moving from LTE cell #310 to #407 in Dallas | eNB mis‑config causes SIP re‑register; vendor patch pending | Toggle Airplane mode or update to fw A13.10 (beta) | ETA 2025‑07       |
| KI‑2025‑002 | AirWave 300 (fw 2.2.1)    | Battery indicator stuck at 1 %                                      | ADC calibration bug                                         | Reboot; fw 2.2.2 in QA                             | ETA 2025‑06       |
| KI‑2025‑003 | LinkEdge R500 on IoT Flex | Throughput exceeds 1 Mbit/s cap after SIM swap                      | Policy not re‑applied when IMSI unchanged                   | Force plan re‑provision via OSS → “Re‑sync QoS”    | Fixed in OSS v4.8 |
| KI‑2025‑004 | DriveSense V2             | MQTT disconnects every 12 h on Verizon roam                         | APN translation drops keep‑alive                            | None; roaming partners patching GGSN               | ETA 2025‑08       |
| KI‑2025‑005 | Unlimited Plus plan       | Hotspot usage incorrectly logged as on‑device after 80 GB           | Usage‑rating engine match error                             | Under investigation; bill shock protection active  | TBD               |

---

## 8  Revision History

| Doc Version | Date       | Author                 | Summary         |
| ----------- | ---------- | ---------------------- | --------------- |
| 1.0         | 2025‑06‑13 | Technical Publications | Initial release |

---

### How to Use This Material

* **Support onboarding** – walk through sections 2–6 in week 1.
* **Live call handling** – keep FAQ & Known Issues open in the CRM side‑panel widget.
* **Field techs** – print device workflows (Sect. 5) in A5 laminate and include in install kits.
* **Curriculum designers** – break each plan and device into micro‑learning modules; quiz on compatibility matrix.

---

*End of comprehensive documentation.*
