/**
 * بوت واتساب الاحترافي الذكي (الإصدار الرابع V4 — Minimal, Humanized & Fast Auto-Clean)
 * عيادة سلامتك لطب الفم وتجميل الأسنان — د. أحمد سلامة أبوالفتوح
 * العنوان: بنها - منشية النور - أول شارع الشموت - عمارة خشالة - أعلى موقف السوزوكي
 */

const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  proto
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3000;

// رقم واتساب الدكتور لاستلام ملخص الحجز النهائي وطلبات التحدث المباشر
const DOCTOR_NUMBER = '201559004796';
const DOCTOR_JID = `${DOCTOR_NUMBER}@s.whatsapp.net`;

const CLINIC_INFO = {
  name: 'عيادة سلامتك لطب الفم وتجميل الأسنان',
  doctor: 'د. أحمد سلامة أبوالفتوح',
  title: 'أخصائي جراحة الفم وتجميل الأسنان بجامعة عين شمس',
  address: 'بنها - منشية النور - أول شارع الشموت - عمارة خشالة - أعلى موقف السوزوكي',
  mapsUrl: 'https://maps.app.goo.gl/d1ZiMy4BAAGX7DEr5?g_st=ac',
  fbUrl: 'https://www.facebook.com/share/19fa9SWc3Q/',
  phone: '01559004796',
  hours: 'جميع أيام الأسبوع ما عدا الجمعة — من الساعة 3:00 عصراً حتى 10:00 مساءً'
};

// قائمة خدمات العيادة الـ 12 بصياغة طبية احترافية وواضحة
const SERVICES_DATA = [
  {
    id: 'SRV_1',
    title: '🩺 الكشف والتشخيص المتكامل',
    details: `🩺 *1. الكشف والتشخيص المتكامل في عيادة سلامتك*\n\nالكشف عندنا خطوة تشخيصية متكاملة تشمل:\n✅ *فحص شامل للفم والأسنان واللثة:* فحص كل الأسنان بدقة لاكتشاف أي تسوس مبكر في بدايته قبل أن يصل للعصب ويزيد تكلفته.\n✅ *جلسة خطة علاج وتشخيص مع د. أحمد سلامة:* يشرح لك الدكتور حالة أسنانك بوضوح، وما يحتاج للبدء الفوري وما يمكن تأجيله.\n✅ *شفافية كاملة:* معرفة خطوات العلاج وتكلفته قبل البدء في أي إجراء.\n\n🎁 *ميزة خاصة لمرضانا:*\nأنت تدفع قيمة الكشف في أول زيارة فقط! جميع الاستشارات والمتابعات وجلسات العلاج التالية تكون *مجاناً بدون أي رسوم كشف إضافية* (تدفع تكلفة الإجراء العلاجي فقط).`
  },
  {
    id: 'SRV_2',
    title: '📸 الأشعة الديجيتال الفورية',
    details: `📸 *2. الأشعة الديجيتال الفورية والسنسور (Portable X-Ray & Sensor)*\n\nلضمان تشخيص دقيق 100% بدون تخمين، الخدمة تشمل:\n✅ *تصوير فوري وأنت جالس على الكرسي:* بجهاز البورتابل والسنسور الرقمي الحديث دون الحاجة للتحرك أو الذهاب لمركز أشعة خارجي.\n✅ *عرض فوري على الشاشة:* يوضح لك د. أحمد شكل الجذور وأي تسوس مخفي بين الأسنان أو تحت اللثة.\n✅ *أمان تام:* نسبة إشعاع لا تُذكر وآمنة تماماً للأطفال والكبار.`
  },
  {
    id: 'SRV_3',
    title: '🦷 حشو العصب المتكامل والدعامة',
    details: `🦷 *3. حشو العصب المتكامل (شامل الأشعة والدعامة والحشو الدائم)*\n\nحشو العصب في عيادة سلامتك هو عملية إنقاذ متكاملة للضرس الطبيعي بدلاً من خلعه، وتشمل *7 خطوات طبية كاملة*:\n1️⃣ *الأشعة الديجيتال (قبل وأثناء وبعد الحشو):* للتأكد من تنظيف وتقفيل القنوات العصبية بالكامل.\n2️⃣ *التخدير الموضعي المريح:* وضع جل مخدر على اللثة أولاً يليه بنج قوي لضمان علاج بدون ألم.\n3️⃣ *إزالة التسوس بالكامل:* تنظيف الضرس من البكتيريا والأنسجة المصابة.\n4️⃣ *سحب العصب وتطهير الجذور بأجهزة الروتاري الحديثة:* دقة عالية في التطهير لمنع أي التهاب مستقبلي.\n5️⃣ *حشو القنوات العصبية بالكامل:* بأحدث الخامات الطبية المعتمدة.\n6️⃣ *تركيب الدعامة (الوتد):* لتقوية الضرس وحمايته من الكسر.\n7️⃣ *الحشو الدائم النهائي:* إعادة بناء الضرس ليمضغ بشكل طبيعي، مع جلسة إرشادات للحفاظ عليه.\n\n💳 *تسهيلات مريحة في الدفع:*\nإذا لم تتوفر التكلفة كاملة دفعة واحدة، يمكنك *تقسيم التكلفة على الجلسات* (دفع جزء مريح في كل جلسة) نقداً أو عبر فودافون كاش أو إنستا باي، وبدون أي رسوم كشف في الجلسات!`
  },
  {
    id: 'SRV_4',
    title: '✨ الحشو العادي التجميلي (ليزر)',
    details: `✨ *4. الحشو العادي التجميلي (حشو ليزر شامل الأشعة)*\n\nعند علاج التسوس مبكراً قبل وصوله للعصب، تشمل الخدمة:\n✅ *أشعة تشخيصية قبل الحشو:* للاطمئنان أن التسوس بعيد عن العصب.\n✅ *تنظيف التسوس بدقة:* إزالة التسوس بالكامل مع الحفاظ على أجزاء السن السليمة.\n✅ *حشو ضوئي (ليزر) تجميلي حديث:* خامات أصلية عالية المتانة وبنفس لون وشكل السن الطبيعي تماماً.\n✅ *تلميع الحشو وضبط العضة:* لتتمكن من المضغ عليه براحة تامة من أول يوم.`
  },
  {
    id: 'SRV_5',
    title: '🧼 تنظيف الجير وتلميع الأسنان',
    details: `🧼 *5. تنظيف الجير وتلميع الأسنان وعلاج اللثة*\n\nالجير المتراكم هو السبب الرئيسي لنزيف اللثة ورائحة الفم غير المستحبة؛ وتشمل الجلسة:\n✅ *إزالة التكتلات الجيرية بالكامل:* بجهاز الموجات فوق الصوتية (Ultrasonic) بلطف تام دون خدش مينا الأسنان.\n✅ *إزالة التصبغات السطحية:* تنظيف آثار الشاي والقهوة والتدخين.\n✅ *تلميع الأسنان (Polishing):* بفرشاة ومعجون طبي خاص يعيد للأسنان نعومتها ولمعانها الطبيعي.\n✅ *جلسة تعليم تفريش الأسنان مع د. أحمد:* شرح عملي للطريقة الصحيحة لغسيل الأسنان لمنع تراكم الجير مرة أخرى.`
  },
  {
    id: 'SRV_6',
    title: '🌸 كحت وتنظيف الجيوب اللثوية',
    details: `🌸 *6. كحت وتنظيف الجيوب اللثوية العميق*\n\nلعلاج التهابات اللثة المتكررة والجيوب التي تحجز الطعام، تشمل الخدمة:\n✅ *تخدير موضعي مريح للثة.*\n✅ *تنظيف وكحت عميق للجيوب اللثوية:* إزالة الرواسب الجيرية والبكتيريا المتراكمة تحت اللثة حول الجذور.\n✅ *تنعيم سطح الجذور:* لمساعدة اللثة على الالتئام والالتصاق بالضرس مجدداً.\n✅ *غسول ومطهرات طبية للثة:* مع متابعة مجانية حتى تمام تعافي اللثة.`
  },
  {
    id: 'SRV_7',
    title: '🩺 الخلع العادي والجراحي وضرس العقل',
    details: `🩺 *7. قسم الجراحة والخلع الآمن (عادي / ضرس العقل / الجذور المتبقية / جراحي)*\n\nنلجأ للخلع فقط عندما لا يكون هناك أمل في علاج الضرس، وتشمل الخدمة:\n✅ *أشعة تشخيصية عند الحاجة:* لتحديد شكل الجذور ووضع ضرس العقل بدقة.\n✅ *تخدير قوي ومضمون:* وضع جل مخدر أولاً ثم البنج الموضعي، ولا نبدأ إلا بعد التأكد التام من عدم وجود أي ألم.\n✅ *خلع هادئ بأدوات حديثة:* للحفاظ على عظم الفك والأنسجة المحيطة.\n✅ *تنظيف الجرح وشرح تعليمات ما بعد الخلع:* لضمان التئام سريع ومريح بدون مضاعفات.`
  },
  {
    id: 'SRV_8',
    title: '👑 التركيبات الثابتة (زيركون وبورسلين)',
    details: `👑 *8. التركيبات الثابتة الحديثة (طربوش زيركون / طربوش بورسلين / لزق طربوش)*\n\nلحماية الضروس المعالجة عصب أو تعويض الأسنان المفقودة، تشمل الخدمة:\n✅ *تحضير الضرس بدقة عالية:* للحفاظ على قوة السن.\n✅ *مقاسات دقيقة:* لضمان تطابق الطربوش مع اللثة ومنع تجمع الطعام.\n✅ *خامات زيركون وبورسلين عالية الجودة:* متانة فائقة في المضغ ومظهر طبيعي يطابق لون أسنانك.\n✅ *اللصق الطبي الثابت وتقسيط الدفع:* إمكانية دفع جزء عند أخذ المقاس والباقي عند التركيب النهائي.`
  },
  {
    id: 'SRV_9',
    title: '😁 التركيبات المتحركة (أكريل وفليكس)',
    details: `😁 *9. التركيبات المتحركة المريحة (أكريل عادي & فليكس مرن)*\n\nلتعويض الأسنان المفقودة (طقم كامل أكريل، نصف طقم، أو سنة متحركة عادية وفليكس)، تشمل الخدمة:\n✅ *مقاسات دقيقة على خطوات:* لضمان ثبات الطقم وراحته أثناء الأكل والكلام.\n✅ *خيار الفليكس المرن الحديث:* خفيف ومريح على اللثة، مقاوم للكسر، وبدون مشابك معدنية ظاهرة.\n✅ *جلسة تجربة (بروفة) قبل التسليم النهائي:* للاطمئنان على الشكل واللون والراحة.\n✅ *متابعة مجانية بعد الاستلام:* مع شرح طريقة تنظيف الطقم والعناية به.`
  },
  {
    id: 'SRV_10',
    title: '🔩 زراعة الأسنان الحديثة',
    details: `🔩 *10. زراعة الأسنان بأحدث الخامات*\n\nأفضل حل طبي لتعويض الأسنان المفقودة دون برد الأسنان السليمة المجاورة، وتشمل:\n✅ *فحص شامل وتقييم عظم الفك بالأشعة الديجيتال.*\n✅ *زرعة تيتانيوم أصلية عالية الجودة:* تلتحم مع عظم الفك لتعمل كجذر طبيعي ثابت.\n✅ *إجراء آمن وغير مؤلم تحت التخدير الموضعي:* تحت إشراف د. أحمد سلامة أخصائي جراحة الفم بجامعة عين شمس.\n✅ *متابعة التئام الزرعة وتركيب الطربوش النهائي:* مع تسهيلات في الدفع على مراحل الزراعة والتركيب.`
  },
  {
    id: 'SRV_11',
    title: '🧒 قسم أسنان الأطفال المتكامل',
    details: `🧒 *11. قسم أسنان الأطفال المتكامل*\n\nتأهيل نفسي وتعامل هادئ مع الطفل ليحب زيارة طبيب الأسنان، ويشمل القسم:\n✅ *جل مخدر بطعم الفواكه قبل البنج:* حتى لا يشعر الطفل بأي ألم.\n✅ *حشو عصب الأطفال والطربوش المعدني:* للحفاظ على الضرس اللبني في مكانه حتى موعد تبديله الطبيعي.\n✅ *الخلع اللطيف وحافظ المسافة (Space Maintainer):* عند الاضطرار لخلع ضرس لبني مبكراً، نركب حافظ مسافة لحجز مكان السن الدائم ومنع اعوجاج الأسنان مستقبلاً.\n✅ *جلسة تعليم الطفل والأم:* لتدريب الطفل على غسيل أسنانه بالطريقة الصحيحة.`
  },
  {
    id: 'SRV_12',
    title: '🍼 طب أسنان الرضع وحديثي الولادة',
    details: `🍼 *12. قسم طب أسنان الأطفال الرضع وحديثي الولادة (الوقاية من تسوس الرضاعة)*\n\nنهتم بصحة أسنان طفلك منذ الشهور الأولى لحمايته من *تسوس الرضاعة* عبر إرشادات عملية للأم:\n1️⃣ *تنظيم الرضاعة الليلية:* تقليل الرضاعة أثناء النوم ليلاً، ومسح لثة وأسنان الرضيع بقطعة *شاش طبي مبللة بماء نظيف* بعد الرضاعة.\n2️⃣ *الفطام التدريجي عن الببرونة:* أو وضع *ماء فقط* فيها بدلاً من اللبن أو العصائر المحلاة وقت النوم.\n3️⃣ *عدم مشاركة الملاعق مع الطفل:* تخصيص ملعقة للطفل وحده وعدم تذوق الطعام بها لمنع انتقال البكتيريا المسببة للتسوس من فم الأم للطفل.\n4️⃣ *تفريش أسنان الرضيع مرتين يومياً:* باستخدام *فرشاة السيليكون* المخصصة للأصبع مع مسحة معجون أطفال بالفلورايد *بحجم أقل من حبة الأرز*.\n5️⃣ *التدخل المبكر:* عند ملاحظة أي بقع بيضاء أو بنية، يجب زيارة العيادة للسيطرة على التسوس مبكراً؛ لأن ألم الأسنان يجعل الطفل يرفض الطعام مما يؤثر على تغذيته ونموه.`
  }
];

const userSessions = new Map();
let sock = null;
let latestQrDataUrl = null;
let connectionStatus = 'جاري تهيئة البوت...';

/**
 * استخراج رقم موبايل مصري سليم 100% وتجاهل أي رقم مشفر (@lid)
 */
function extractCleanPhoneNumber(msg, jid) {
  const candidates = [
    msg?.key?.senderPn,
    msg?.key?.remoteJidAlt,
    msg?.key?.participant,
    msg?.participant,
    jid
  ].filter(Boolean);

  for (const cand of candidates) {
    const str = String(cand);
    if (str.endsWith('@lid')) continue;
    const raw = str.split('@')[0].split(':')[0].replace(/\D/g, '');
    // رقم مصري بصيغة 201xxxxxxxxx
    if (raw.startsWith('201') && raw.length === 12) {
      return '0' + raw.substring(2);
    }
    // رقم مصري بصيغة 01xxxxxxxxx
    if (raw.startsWith('01') && raw.length === 11) {
      return raw;
    }
  }
  return null;
}

/**
 * مسح الرسائل التمهيدية بعد 5 ثوانٍ فقط وإخفاء أثرها من الشات
 * حتى تبقى المحادثة بين الدكتور والمريض نظيفة تماماً (Minimal)
 */
function scheduleFiveSecondClean(jid, botMsgKey, userIncomingMsg) {
  setTimeout(async () => {
    const nowTs = Math.floor(Date.now() / 1000);

    // 1. مسح رسالة البوت لدى المريض ولدى الدكتور
    if (botMsgKey) {
      try {
        await sock.sendMessage(jid, { delete: botMsgKey });
      } catch (e) {}

      // مسح إشعار "تم مسح هذه الرسالة" من هاتف الدكتور بعد ثانية واحدة
      setTimeout(async () => {
        try {
          await sock.chatModify(
            {
              deleteForMe: {
                deleteMedia: false,
                key: botMsgKey,
                timestamp: nowTs
              }
            },
            jid
          );
        } catch (e) {}
      }, 1200);
    }

    // 2. مسح ضغطة/رسالة العميل التمهيدية من شات الدكتور بدون ترك أي أثر
    if (userIncomingMsg && userIncomingMsg.key) {
      const msgTs = Number(userIncomingMsg.messageTimestamp) || nowTs;
      try {
        await sock.chatModify(
          {
            deleteForMe: {
              deleteMedia: false,
              key: userIncomingMsg.key,
              timestamp: msgTs
            }
          },
          jid
        );
      } catch (e) {}
      try {
        await sock.chatModify(
          {
            clear: {
              messages: [
                {
                  id: userIncomingMsg.key.id,
                  fromMe: userIncomingMsg.key.fromMe,
                  timestamp: msgTs
                }
              ]
            }
          },
          jid
        );
      } catch (e) {}
    }
  }, 5000); // 5 ثوانٍ بالضبط بعد الانتقال للخطوة التالية!
}

/**
 * تنظيف الخطوة السابقة بعد 5 ثوانٍ من انتقال المريض للخطوة الجديدة
 */
function cleanPreviousStepAfter5Seconds(jid, session, currentIncomingMsg) {
  if (!session) return;

  const prevBotKeys = [...(session.botMsgKeys || [])];
  const prevUserMsgs = [...(session.userMsgs || [])];
  if (currentIncomingMsg && currentIncomingMsg.key) {
    prevUserMsgs.push(currentIncomingMsg);
  }

  session.botMsgKeys = [];
  session.userMsgs = [];

  for (const bKey of prevBotKeys) {
    scheduleFiveSecondClean(jid, bKey, null);
  }
  for (const uMsg of prevUserMsgs) {
    scheduleFiveSecondClean(jid, null, uMsg);
  }
}

/**
 * إرسال رسالة تفاعلية بأزرار احترافية مع تنظيف الخطوة السابقة خلال 5 ثوانٍ
 */
async function sendSmartInteractive(jid, text, items = [], listButtonTitle = '📋 اضغط هنا للاختيار', lastIncomingMsg = null, keepForever = false) {
  let session = userSessions.get(jid);
  if (!session) {
    session = { mode: 'MAIN_MENU', step: 0, bookingData: {}, botMsgKeys: [], userMsgs: [] };
    userSessions.set(jid, session);
  }

  if (lastIncomingMsg && lastIncomingMsg.key) {
    try {
      await sock.readMessages([lastIncomingMsg.key]);
    } catch (e) {}
  }

  // مسح الرسائل السابقة بعد 5 ثوانٍ من إرسال الخطوة الجديدة
  cleanPreviousStepAfter5Seconds(jid, session, keepForever ? null : lastIncomingMsg);

  if (!items || items.length === 0) {
    const sent = await sock.sendMessage(jid, { text });
    if (sent && sent.key && !keepForever) {
      session.botMsgKeys.push(sent.key);
    }
    return;
  }

  const allShort = items.length <= 3 && items.every(it => (it.title || '').length <= 30 && !it.desc);

  let buttons = [];
  if (allShort) {
    buttons = items.map(it => ({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: it.title,
        id: it.id
      })
    }));
  } else {
    buttons = [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: listButtonTitle,
          sections: [
            {
              title: 'عيادة سلامتك — اختر بلمسة واحدة',
              rows: items.map(it => ({
                header: '',
                title: it.title,
                description: it.desc || '',
                id: it.id
              }))
            }
          ]
        })
      }
    ];
  }

  try {
    const interactiveMsg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({ text }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: 'عيادة سلامتك لطب وتجميل الأسنان — د. أحمد سلامة'
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: '',
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons,
                messageParamsJson: ''
              })
            })
          }
        }
      },
      {}
    );

    await sock.relayMessage(jid, interactiveMsg.message, {
      messageId: interactiveMsg.key.id,
      additionalNodes: [
        {
          tag: 'biz',
          attrs: {},
          content: [
            {
              tag: 'interactive',
              attrs: { type: 'native_flow', v: '1' },
              content: [
                {
                  tag: 'native_flow',
                  attrs: { v: '9', name: 'mixed' }
                }
              ]
            }
          ]
        },
        {
          tag: 'bot',
          attrs: { biz_bot: '1' }
        }
      ]
    });

    if (!keepForever && interactiveMsg.key) {
      session.botMsgKeys.push(interactiveMsg.key);
    }
  } catch (err) {
    console.error('Fallback send error:', err.message);
    const sentFallback = await sock.sendMessage(jid, { text });
    if (sentFallback && sentFallback.key && !keepForever) {
      session.botMsgKeys.push(sentFallback.key);
    }
  }
}

/**
 * رسالة الترحيب الأولى: مختصرة، جذابة، احترافية (To The Point)
 * وتحتها خيار المتابعة مع المساعد الذكي أو التحدث المباشر مع د. أحمد سلامة
 */
async function sendWelcomeMenu(jid, lastMsg = null, pushName = '') {
  let existing = userSessions.get(jid);
  const cleanPhone = extractCleanPhoneNumber(lastMsg, jid) || existing?.cleanPhone || '';
  const patientDisplayName = pushName || existing?.pushName || 'ضيفنا العزيز';

  const session = {
    mode: 'WELCOME_CHOICE',
    step: 0,
    waitingCustomInput: false,
    waitingHumanPhone: false,
    pushName: patientDisplayName,
    cleanPhone: cleanPhone,
    bookingData: {},
    botMsgKeys: existing?.botMsgKeys || [],
    userMsgs: existing?.userMsgs || []
  };
  userSessions.set(jid, session);

  const welcomeMsg =
    `أهلاً وسهلاً بحضرتك يا أستاذ/ة *${patientDisplayName}* 🌟\n` +
    `مرحباً بك في *${CLINIC_INFO.name}*\n` +
    `معك المساعد الذكي لعيادة *${CLINIC_INFO.doctor}*\n` +
    `(${CLINIC_INFO.title}) 👨‍⚕️\n\n` +
    `✨ *ما الذي يميز عيادة سلامتك؟*\n` +
    `• *الكشف يُدفع أول مرة فقط:* جميع الاستشارات والمتابعات وجلسات العلاج التالية مجانية بدون كشف جديد.\n` +
    `• *دقة وراحة تامة:* أشعة ديجيتال فورية وأنت على الكرسي، وجلسة تشخيص لشرح خطة علاجك كاملة، مع إمكانية تقسيط تكلفة الجلسات (كاش، فودافون كاش، أو إنستا باي).\n\n` +
    `🤖 *ماذا يقدم لك المساعد الذكي الآن؟*\n` +
    `• يوضح لك تفاصيل وخطوات كل خدمة، ويثقفك طبياً لحماية أسنانك وأسنان أطفالك من التسوس وتجنب أي تكلفة علاج إضافية، مع حجز موعدك في ثوانٍ.\n\n` +
    `👇 *اختر كيف تود المتابعة الآن:*`;

  const choiceButtons = [
    { id: 'CMD_SHOW_FULL_MENU', title: '🤖 متابعة مع المساعد الذكي' },
    { id: 'CMD_HUMAN_CHAT', title: '👨‍⚕️ التحدث مع د. أحمد مباشرة' }
  ];

  await sendSmartInteractive(jid, welcomeMsg, choiceButtons, '👇 اختر طريقة المتابعة', lastMsg);
}

/**
 * القائمة الرئيسية الكاملة لخدمات العيادة والحجز والطوارئ
 */
async function showFullMainMenu(jid, lastMsg = null) {
  let session = userSessions.get(jid);
  if (!session) {
    session = { mode: 'MAIN_MENU', step: 0, bookingData: {}, botMsgKeys: [], userMsgs: [] };
    userSessions.set(jid, session);
  }
  session.mode = 'MAIN_MENU';
  session.waitingHumanPhone = false;

  const menuMsg =
    `🦷 *القائمة الرئيسية — ${CLINIC_INFO.name}*\n` +
    `(${CLINIC_INFO.doctor}) 👨‍⚕️\n\n` +
    `اضغط على الزر بالأسفل لاختيار القسم أو الخدمة المطلوبة، أو اكتب سؤالك مباشرة في الشات 👇`;

  const mainItems = [
    { id: 'MENU_BOOKING', title: '📅 حجز موعد في العيادة' },
    { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة بالتفصيل' },
    { id: 'MENU_EMERGENCY', title: '🚨 حالات الطوارئ والحوادث' },
    { id: 'MENU_ROOT_CANAL', title: '💳 حشو العصب وتقسيط الدفع' },
    { id: 'MENU_WHY_US', title: '✨ مميزات وأجهزة العيادة' },
    { id: 'MENU_PLEDGE', title: '🤝 ميثاق الأمانة وراحة المريض' },
    { id: 'MENU_AFTERCARE', title: '🪥 تعليمات بعد العلاج والغسيل' },
    { id: 'MENU_LOCATION', title: '📍 العنوان والمواعيد واللوكيشن' },
    { id: 'CMD_HUMAN_CHAT', title: '👨‍⚕️ التحدث مع د. أحمد مباشرة' }
  ];

  await sendSmartInteractive(jid, menuMsg, mainItems, '📋 القائمة الرئيسية للعيادة', lastMsg);
}

/**
 * فهم ذكي وطبيعي للرسائل المكتوبة (Humanized NLU)
 */
function detectSmartIntent(text) {
  const t = text.toLowerCase().trim();
  if (
    t === '0' ||
    t === 'إلغاء' ||
    t === 'الغاء' ||
    t.includes('إلغاء الحجز') ||
    t.includes('الغاء الحجز') ||
    t.includes('القائمة الرئيسية') ||
    t.includes('العودة للبوت') ||
    t.includes('عودة للبوت') ||
    t.includes('المساعد الذكي') ||
    t === 'بوت' ||
    t === 'البوت'
  ) {
    return 'CMD_SHOW_FULL_MENU';
  }
  if (t.includes('حجز') || t.includes('موعد') || t.includes('احجز') || t.includes('كشف')) {
    return 'MENU_BOOKING';
  }
  if (t.includes('طوارئ') || t.includes('حادث') || t.includes('وقعت') || t.includes('اتكسرت') || t.includes('تورم') || t.includes('ورم') || t.includes('تنفس')) {
    return 'MENU_EMERGENCY';
  }
  if (t.includes('عصب') || t.includes('تقسيط') || t.includes('دفعات') || t.includes('فودافون') || t.includes('انستا') || t.includes('سعر') || t.includes('تكلفة') || t.includes('تكلفه')) {
    return 'MENU_ROOT_CANAL';
  }
  if (t.includes('عنوان') || t.includes('مكان') || t.includes('فين') || t.includes('مواعيد') || t.includes('لوكيشن') || t.includes('خريطة') || t.includes('منشية النور') || t.includes('الشموت')) {
    return 'MENU_LOCATION';
  }
  if (t.includes('مميزات') || t.includes('اشعة') || t.includes('أشعة') || t.includes('سنسور') || t.includes('تعقيم')) {
    return 'MENU_WHY_US';
  }
  if (t.includes('عهد') || t.includes('خايف') || t.includes('قلقان') || t.includes('ميثاق')) {
    return 'MENU_PLEDGE';
  }
  if (t.includes('تعليمات') || t.includes('غسيل') || t.includes('فرشاة') || t.includes('تفريش')) {
    return 'MENU_AFTERCARE';
  }
  if (t.includes('خدمات') || t.includes('زراعة') || t.includes('طربوش') || t.includes('زيركون') || t.includes('بورسلين') || t.includes('جير') || t.includes('رضع') || t.includes('اطفال') || t.includes('أطفال') || t.includes('خلع') || t.includes('حشو')) {
    return 'MENU_SERVICES';
  }
  return null;
}

/**
 * تحويل المحادثة للتحدث المباشر مع د. أحمد مع ضمان إرسال رقم موبايل سليم 100% للدكتور
 */
async function triggerHumanChatHandoff(jid, session, lastMsg) {
  // إذا كان المريض مفعل خاصية إخفاء الرقم باليوزر نيم (@lid) ولم نعرف رقمه بعد، نطلبه منه أولاً في خطوة مستقلة!
  if (!session.cleanPhone) {
    session.mode = 'WAITING_HUMAN_PHONE';
    await sendSmartInteractive(
      jid,
      `👨‍⚕️ *التواصل المباشر مع د. أحمد سلامة*\n\n📱 نظراً لأن حسابك على واتساب يستخدم ميزة *اسم المستخدم (Username)* وإخفاء الرقم، من فضلك اكتب *رقم موبايلك (11 رقم)* في رسالة الآن ليتمكن د. أحمد من التواصل معك مباشرة:`,
      [{ id: 'CMD_SHOW_FULL_MENU', title: '🔙 إلغاء والعودة للقائمة' }],
      'اختر',
      lastMsg
    );
    return;
  }

  await completeHumanChatHandoff(jid, session, lastMsg);
}

async function completeHumanChatHandoff(jid, session, lastMsg) {
  session.mode = 'HUMAN_CHAT';
  await sendSmartInteractive(
    jid,
    `👨‍⚕️ *تم تحويلك للمحادثة المباشرة مع د. أحمد سلامة*\n\nتفضل بكتابة استفسارك أو رسالتك هنا في الشات، وسيقوم الدكتور بالرد عليك مباشرة.\n\n💡 *(للعودة إلى المساعد الذكي في أي وقت، اضغط الزر بالأسفل أو اكتب كلمة "بوت")*.`,
    [{ id: 'CMD_SHOW_FULL_MENU', title: '🤖 العودة للمساعد الذكي' }],
    'اختر',
    lastMsg,
    false // يتم تنظيف رسالة التحويل أيضاً بعد الانتهاء لتبقى محادثتك البشرية فقط
  );

  try {
    const pPhone = session.cleanPhone;
    const waLink = pPhone.startsWith('01') ? `https://wa.me/2${pPhone}` : '';
    const humanAlert =
      `🔔 *طلب تحدث مباشر على الواتساب*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 *اسم المريض:* ${session.pushName || 'مريض جديد'}\n` +
      `📱 *رقم الموبايل:* ${pPhone}\n` +
      (waLink ? `💬 *رابط المحادثة المباشر:* ${waLink}` : '');
    await sock.sendMessage(DOCTOR_JID, { text: humanAlert });
  } catch (e) {}
}

async function handlePatientInput(jid, rawIdOrText, lastMsg = null, pushName = '') {
  const input = (rawIdOrText || '').trim();
  if (!input) return;

  let session = userSessions.get(jid);
  const detectedPhone = extractCleanPhoneNumber(lastMsg, jid);
  if (session && detectedPhone) {
    session.cleanPhone = detectedPhone;
  }
  if (session && pushName && (!session.pushName || session.pushName === 'ضيفنا العزيز')) {
    session.pushName = pushName;
  }

  // 1. فحص فوري للإلغاء أو العودة للبداية أو القائمة الرئيسية من أي مكان وفي أي وقت!
  if (
    input === 'CMD_MAIN_MENU' ||
    input === '0' ||
    input === 'إلغاء' ||
    input === 'الغاء' ||
    input.includes('إلغاء والعودة') ||
    input.includes('الغاء والعودة') ||
    input.includes('إلغاء الحجز')
  ) {
    await sendWelcomeMenu(jid, lastMsg, pushName || session?.pushName);
    return;
  }

  if (
    input === 'CMD_SHOW_FULL_MENU' ||
    input.includes('متابعة مع المساعد الذكي') ||
    input.includes('العودة للمساعد الذكي') ||
    input.includes('العودة للبوت') ||
    input.includes('عودة للبوت') ||
    input.includes('القائمة الرئيسية') ||
    input === 'بوت' ||
    input === 'البوت'
  ) {
    await showFullMainMenu(jid, lastMsg);
    return;
  }

  if (!session) {
    await sendWelcomeMenu(jid, lastMsg, pushName);
    return;
  }

  // إذا كان المريض يُدخل رقمه للتحدث المباشر (لأصحاب حسابات اليوزر نيم المخفية)
  if (session.mode === 'WAITING_HUMAN_PHONE') {
    const digits = input.replace(/\D/g, '');
    session.cleanPhone = digits || input;
    await completeHumanChatHandoff(jid, session, lastMsg);
    return;
  }

  // إذا طلب التحدث المباشر مع د. أحمد
  if (input === 'CMD_HUMAN_CHAT' || input.includes('التحدث مع د. أحمد مباشرة')) {
    await triggerHumanChatHandoff(jid, session, lastMsg);
    return;
  }

  // إذا كان في وضع المحادثة البشرية مع الدكتور، يصمت البوت تماماً (إلا إذا طلب العودة للبوت أعلاه)
  if (session.mode === 'HUMAN_CHAT') {
    return;
  }

  // إذا ضغط على بدء الحجز
  if (input === 'MENU_BOOKING' || input === 'CMD_START_BOOKING') {
    await startBookingFlow(jid, lastMsg, pushName || session.pushName);
    return;
  }

  // إذا كان المريض داخل خطوات الحجز، نمرر إجابته لنظام الحجز
  if (session.mode === 'BOOKING') {
    await processBookingStep(jid, session, input, lastMsg);
    return;
  }

  // فهم ذكي لما يكتبه المريض في الشات
  const detectedIntent = detectSmartIntent(input);
  const activeCommand = detectedIntent || input;

  if (activeCommand === 'CMD_SHOW_FULL_MENU') {
    await showFullMainMenu(jid, lastMsg);
    return;
  }

  if (activeCommand === 'MENU_BOOKING') {
    await startBookingFlow(jid, lastMsg, session.pushName);
    return;
  }

  // ==================== قسم الطوارئ والحوادث ====================
  if (activeCommand === 'MENU_EMERGENCY') {
    session.mode = 'EMERGENCY_MENU';
    await sendSmartInteractive(
      jid,
      `🚨 *قسم حالات الطوارئ والحوادث (إرشادات طبية عاجلة)*\n\nاختر الحالة من الأزرار بالأسفل لمعرفة التصرف الطبي الصحيح فوراً 👇`,
      [
        { id: 'EMERG_SWELLING', title: '⚠️ ورم شديد أو صعوبة تنفس' },
        { id: 'EMERG_TRAUMA', title: '🦷 حوادث وصدمات الأسنان' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      '🚨 اختر حالة الطوارئ',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'EMERG_SWELLING') {
    const msg = `⚠️ *طوارئ التورم الشديد وصعوبة التنفس (يرجى الانتباه جيداً):*\n\n1️⃣ *ورم شديد منتشر في الوجه مع سخونة واحمرار:*\nإذا كان هناك تورم شديد ينتشر في الوجه مع ارتفاع في درجة الحرارة واحمرار، *يجب التوجه فوراً إلى قسم الطوارئ في أقرب مستشفى* لتلقي الرعاية الطبية العاجلة.\n\n2️⃣ *تورم أسفل الحلق وصعوبة التنفس أو البلع (Ludwig's Angina):*\nإذا كان التورم في أسفل الفك والحلق ويسبب ضيقاً أو انسداداً في مجرى الهواء وصعوبة في التنفس، *فهذه حالة طوارئ حرجة تستوجب التوجه الفوري لأقرب مستشفى* لتأمين مجرى التنفس.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'EMERG_TRAUMA', title: '🦷 طوارئ حوادث الأسنان' },
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد بالعيادة' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'EMERG_TRAUMA') {
    await sendSmartInteractive(
      jid,
      `🦷 *حالات التروما والصدمات (وقوع أو كسر سنة نتيجة خبطة أو حادث):*\n\nالتصرف الصحيح يختلف حسب نوع السنة المصابة؛ اختر من الأسفل 👇`,
      [
        { id: 'TRAUMA_MILK', title: '🧒 سنة لبنية (أطفال)' },
        { id: 'TRAUMA_PERM', title: '🦷 سنة دائمة (كبار/أطفال)' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر نوع السنة المصابة',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'TRAUMA_MILK') {
    const msg = `🧒 *إرشادات سقوط أو صدمات السنة اللبنية (للأطفال):*\n\n✅ *لا تحاول إرجاع السنة لمكانها:* السنة اللبنية المخلوعة لا يتم إرجاعها لمكانها حتى لا نؤذي برعم السن الدائم الموجود تحتها.\n✅ *لا داعي للاحتفاظ بها:* لا يلزم الاحتفاظ بالسنة اللبنية التي سقطت.\n✅ *الخطوة الأهم:* التوجه للعيادة في أقرب وقت ليقوم د. أحمد سلامة بفحص الطفل والاطمئنان على اللثة وباقي الأسنان.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'TRAUMA_PERM', title: '🦷 لو سنة دائمة؟' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'TRAUMA_PERM') {
    const msg = `🦷 *إرشادات إنقاذ السنة الدائمة المخلوعة أو المكسورة (عامل الوقت حاسم جداً!):*\n\nإذا سقطت *سنة دائمة* نتيجة خبطة، اتبع هذه الخطوات فوراً:\n\n1️⃣ *أمسك السنة بشكل صحيح:* أمسكها من *الجزء الأبيض (التاج / الطربوش)*، وتجنب تماماً لمس *الجزء الأصفر (الجذر)* للحفاظ على حيوية خلايا الجذر.\n\n2️⃣ *إرجاع السنة لمكانها إن أمكن:* إذا استطعت وضعها في مكانها الصحيح برفق فافعل ذلك، وتوجه للعيادة فوراً.\n\n3️⃣ *إذا لم تتمكن من إرجاعها (طريقة الحفظ الصحيحة):*\n- إذا كان المصاب شخصاً كبيراً أو طفلاً واعياً: يمكنه *وضعها داخل فمه (بين الخد واللثة)* لأن *اللعاب* هو أفضل بيئة طبيعية تحافظ على السنة.\n- أو ضعها فوراً في *كوب من اللبن البارد*، وتوجه للعيادة بأقصى سرعة ممكنة!\n\n⏰ *تذكر:* كلما توجهت للعيادة مبكراً، كانت نسبة نجاح إنقاذ وتثبيت السنة أعلى بكثير.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد طوارئ' },
        { id: 'MENU_LOCATION', title: '📍 عنوان وأرقام العيادة' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  // ==================== قسم خدمات العيادة الـ 12 ====================
  if (activeCommand === 'MENU_SERVICES') {
    session.mode = 'SERVICES_MENU';
    const srvItems = SERVICES_DATA.map(s => ({
      id: s.id,
      title: s.title
    }));
    await sendSmartInteractive(
      jid,
      `🦷 *قائمة خدمات عيادة سلامتك (12 خدمة متكاملة)*\n\nاضغط على الزر بالأسفل لاختيار الخدمة وقراءة كافة خطواتها وتفاصيلها 👇`,
      srvItems,
      '🦷 اختر الخدمة لعرض تفاصيلها',
      lastMsg
    );
    return;
  }

  const matchedSrv = SERVICES_DATA.find(s => s.id === activeCommand || input.includes(s.title));
  if (matchedSrv) {
    await sendSmartInteractive(
      jid,
      matchedSrv.details,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 باقي خدمات العيادة' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  // ==================== حشو العصب وتقسيط الدفع ====================
  if (activeCommand === 'MENU_ROOT_CANAL') {
    const msg = `💳 *تفاصيل حشو العصب المتكامل وتسهيلات الدفع في عيادة سلامتك*\n\nحشو العصب هو عملية طبية متكاملة لإنقاذ ضرسك الطبيعي بدلاً من خلعه، ويشمل في عيادتنا *7 خطوات كاملة*:\n1️⃣ أشعة ديجيتال وسنسور قبل وأثناء وبعد الحشو.\n2️⃣ تخدير موضعي كامل بدون ألم.\n3️⃣ إزالة التسوس بالكامل وتنظيف الضرس.\n4️⃣ سحب العصب وتطهير الجذور بأحدث أجهزة الروتاري.\n5️⃣ حشو القنوات العصبية بالكامل.\n6️⃣ تركيب الدعامة (الوتد) لتقوية الضرس وحمايته من الكسر.\n7️⃣ الحشو الدائم النهائي فوق الضرس + شرح طريقة العناية به.\n\n🌟 *تسهيلات مريحة في السداد:*\n✅ *تقسيم التكلفة على الجلسات:* يتم العمل على جلسات، ويمكنك دفع جزء مريح في كل جلسة دون ضغط.\n✅ *الكشف يُدفع أول مرة فقط:* لا توجد أي رسوم كشف إضافية في الجلسات التالية.\n✅ *طرق الدفع المتاحة:* نقداً (كاش) بالعيادة، أو عبر *فودافون كاش (Vodafone Cash)* أو *إنستا باي (InstaPay)*.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  // ==================== مميزات العيادة ====================
  if (activeCommand === 'MENU_WHY_US') {
    const msg = `✨ *لماذا يختار المرضى في منشية النور وبنها عيادة سلامتك؟*\n\n1️⃣ *أشعة ديجيتال وسنسور فوري (Portable X-Ray & Sensor):*\nتصوير الضرس وأنت جالس على الكرسي في ثوانٍ دون الحاجة للتحرك، ومشاهدة الصورة بوضوح على الشاشة.\n\n2️⃣ *جلسة خطة علاج وتشخيص قبل البدء:*\nيجلس معك د. أحمد سلامة لشرح حالة أسنانك بالكامل ووضع خطة العلاج المناسبة قبل البدء في أي إجراء.\n\n3️⃣ *جلسة تعليم غسيل الأسنان والعناية بعد العلاج:*\nبعد انتهاء العلاج، يشرح لك الدكتور عملياً كيفية الحفاظ على العلاج والطريقة الصحيحة لتفريش أسنانك.\n\n4️⃣ *الكشف يُدفع مرة واحدة فقط:*\nتدفع الكشف في الزيارة الأولى فقط، وجميع جلسات العلاج والاستشارات والمتابعات التالية مجانية.\n\n5️⃣ *نظام تعقيم طبي متكامل وعلاج بدون ألم:*\nأدوات معقمة في أكياس فردية تُفتح أمامك، مع استخدام جل مخدر موضعي قبل البنج وخامات أصلية حديثة.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  // ==================== ميثاق الأمانة ====================
  if (activeCommand === 'MENU_PLEDGE') {
    const msg = `🤝 *ميثاق الأمانة وراحة المريض من د. أحمد سلامة أبوالفتوح:*\n\n🦷 *1. الحفاظ على الضرس الطبيعي (بدون استعجال في الخلع):*\nلا نلجأ لخلع أي ضرس طالما هناك فرصة لعلاجه والحفاظ عليه.\n\n💰 *2. خدمة طبية محترمة تناسب ما تدفعه:*\nنلتزم بتقديم رعاية طبية متقنة بأحدث الأجهزة وخامات أصلية تعيش معك طويلاً، ونوضح لك بكل أمانة ما هو ضروري وما يمكن تأجيله.\n\n💳 *3. تيسير في الدفع وتقسيط على الجلسات:*\nفي العلاجات التي تتم على جلسات (مثل حشو العصب أو التركيبات)، يمكنك تقسيم التكلفة على دفعات مريحة مع كل جلسة (كاش أو فودافون كاش أو إنستا باي).\n\n💉 *4. راحتك النفسية أولاً:*\nلا نبدأ العمل إلا بعد التأكد التام من مفعول التخدير وراحتك الكاملة.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_WHY_US', title: '✨ مميزات العيادة' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  // ==================== تعليمات ما بعد العلاج والغسيل ====================
  if (activeCommand === 'MENU_AFTERCARE') {
    await sendSmartInteractive(
      jid,
      `🪥 *تعليمات د. أحمد سلامة للعناية بأسنانك بعد العلاج*\n\nاختر التعليمات المطلوبة من الزر بالأسفل 👇`,
      [
        { id: 'CARE_EXT', title: '🩹 تعليمات ما بعد الخلع والجراحة' },
        { id: 'CARE_RC', title: '🦷 تعليمات ما بعد حشو العصب والحشو' },
        { id: 'CARE_CROWN', title: '👑 تعليمات الطرابيش والأطقم المتحركة' },
        { id: 'CARE_BRUSH', title: '🪥 الطريقة الصحيحة لغسيل الأسنان' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      '🪥 اختر التعليمات المطلوبة',
      lastMsg
    );
    return;
  }

  if (activeCommand.startsWith('CARE_')) {
    let text = '';
    if (activeCommand === 'CARE_EXT') {
      text = `🩹 *تعليمات مهمة بعد خلع الضرس:*\n\n1️⃣ *الضغط على القطنة:* عض على القطنة الطبية المعقمة لمدة ساعة متواصلة دون تغييرها.\n2️⃣ *تجنب المضمضة أو البصق:* لمدة 24 ساعة للحفاظ على الجلطة الدموية ومساعدة الجرح على الالتئام.\n3️⃣ *الطعام والشراب:* تناول أطعمة ومشروبات باردة ولينة في اليوم الأول، وتجنب المشروبات الساخنة والتدخين لمدة 24 ساعة.\n4️⃣ *بعد 24 ساعة:* ابدأ المضمضة بماء دافئ وملح خفيف أو الغسول الطبي الموصوف بعد الوجبات.`;
    } else if (activeCommand === 'CARE_RC') {
      text = `🦷 *تعليمات بعد حشو العصب أو الحشو التجميلي:*\n\n1️⃣ *تجنب الأكل حتى يزول البنج:* انتظر حوالي ساعتين حتى يزول التخدير تماماً لتجنب عض الشفاه أو اللسان.\n2️⃣ *بين جلسات حشو العصب:* تجنب المضغ القوي أو الأطعمة الصلبة على الضرس المعالج حتى يتم وضع الدعامة والحشو النهائي.\n3️⃣ *حماية الضرس بالطربوش:* بعد إتمام حشو العصب والدعامة، يُنصح بتركيب طربوش لحماية الضرس من الكسر.`;
    } else if (activeCommand === 'CARE_CROWN') {
      text = `👑 *تعليمات الحفاظ على التركيبات الثابتة والمتحركة:*\n\n✅ *للتركيبات الثابتة (الزيركون والبورسلين):*\n- امتنع عن الأكل لمدة ساعة بعد لصق الطربوش، وتجنب الأطعمة الصلبة أو اللزجة في أول 24 ساعة.\n- نظف الطربوش بالفرشاة والمعجون والخيط الطبي تماماً كالأسنان الطبيعية.\n\n✅ *للأطقم والتركيبات المتحركة (الأكريل والفليكس):*\n- اغسل الطقم بعد كل وجبة بفرشاة ناعمة، واخلعه أثناء النوم وضعه في كوب ماء نظيف لراحة اللثة.`;
    } else {
      text = `🪥 *الطريقة الصحيحة لغسيل الأسنان (إرشادات د. أحمد سلامة):*\n\n1️⃣ *التوقيت الأهم:* مرتين يومياً — صباحاً، وأهم مرة *قبل النوم مباشرة*.\n2️⃣ *حركة الفرشاة الصحيحة:* حرك الفرشاة بزاوية مائلة من اللثة باتجاه السن (من أعلى لأسفل في الفك العلوي، ومن أسفل لأعلى في الفك السفلي) بحركة دائرية لطيفة، وتجنب غسيل أو تفريش الأسنان بالعرض بقوة حتى لا تنزف اللثة.\n3️⃣ *الأسطح الداخلية واللسان:* نظف الأسطح الداخلية للضروس وامسح سطح اللسان بالفرشاة.\n4️⃣ *نوع الفرشاة:* استخدم فرشاة ناعمة (Soft) أو متوسطة (Medium) وبدلها كل 3 أشهر.`;
    }
    await sendSmartInteractive(
      jid,
      text,
      [
        { id: 'MENU_AFTERCARE', title: '🔙 باقي التعليمات' },
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  // ==================== العنوان والمواعيد ====================
  if (activeCommand === 'MENU_LOCATION') {
    const msg = `📍 *عنوان ومواعيد ${CLINIC_INFO.name}*\n\n👨‍⚕️ *الطبيب المعالج:*\n${CLINIC_INFO.doctor}\n(${CLINIC_INFO.title})\n\n🏢 *العنوان بالتفصيل:*\n${CLINIC_INFO.address}\n\n🗺️ *موقع العيادة على خرائط جوجل (Google Maps):*\n${CLINIC_INFO.mapsUrl}\n\n📘 *صفحتنا الرسمية على فيسبوك:*\n${CLINIC_INFO.fbUrl}\n\n🕒 *مواعيد العمل:*\n${CLINIC_INFO.hours}\n\n📞 *رقم الهاتف والواتساب:*\n*${CLINIC_INFO.phone}*`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة' },
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  await sendWelcomeMenu(jid, lastMsg, session.pushName);
}

// ==================== نظام الحجز والاستبيان الإحصائي الذكي (4 خطوات مركزة) ====================
/**
 * بناءً على توجيه د. أحمد: تم إلغاء الأسئلة (2 العمر، 4 التاريخ المرضي، 5 الوجع، 7 الخدمة، 9 الموعد)
 * والإبقاء على الاستبيان الإحصائي المركز:
 * 1. الاسم الثلاثي (وطلب الرقم فقط في خطوة مستقلة لمن يخفي رقمه باليوزر نيم).
 * 2. البلد / المنطقة (منشية النور والقرى المجاورة وبنها...).
 * 3. التجربة السابقة وما يشغل بال المريض.
 * 4. كيف تعرف المريض على العيادة (سوشيال ميديا / ترشيح صديق مع إمكانية كتابة اسمه / أهل المنطقة / بالصدفة).
 */
async function startBookingFlow(jid, lastMsg = null, pushName = '') {
  let oldSession = userSessions.get(jid);
  const cleanPhone = extractCleanPhoneNumber(lastMsg, jid) || oldSession?.cleanPhone || '';
  const displayName = pushName || oldSession?.pushName || '';

  const session = {
    mode: 'BOOKING',
    step: 1,
    waitingCustomInput: false,
    pushName: displayName,
    cleanPhone: cleanPhone,
    botMsgKeys: oldSession?.botMsgKeys || [],
    userMsgs: oldSession?.userMsgs || [],
    bookingData: {
      name: '',
      phone: cleanPhone,
      area: '',
      prevVisitAndFear: '',
      source: ''
    }
  };
  userSessions.set(jid, session);

  const greetingName = displayName && displayName !== 'ضيفنا العزيز' ? `يا أستاذ/ة *${displayName}*` : 'بحضرتك';

  const intro =
    `📅 *أهلاً ${greetingName} في تسجيل الحجز بعيادة سلامتك*\n` +
    `(${CLINIC_INFO.doctor})\n\n` +
    `📌 *تنبيه مهم قبل البدء:*\n` +
    `• إذا رغبت في أي لحظة في التراجع أو قراءة خدمات العيادة، اضغط زر *(إلغاء والعودة للبداية)* أو اكتب كلمة *(إلغاء)* في الشات.\n` +
    `• *حرية الكتابة الكاملة:* في جميع الأسئلة القادمة لست مقيداً بالاختيارات الجاهزة؛ يمكنك *كتابة إجابتك بنفسك بالتفصيل في رسالة* (سواء اسم بلدك بالتحديد، أو اسم الصديق الذي رشح لك العيادة، أو أي ملاحظة) وسيفهمها المساعد الذكي ويسجلها فوراً!\n\n` +
    `*الخطوة 1 من 4:*\n` +
    `من فضلك اكتب *الاسم الثلاثي للمريض* في رسالة الآن (أو اضغط على الزر بالأسفل):`;

  const step1Buttons = [];
  if (displayName && displayName !== 'ضيفنا العزيز') {
    step1Buttons.push({ id: `USE_NAME_${displayName}`, title: `👤 الحجز باسم: ${displayName.substring(0, 14)}` });
  }
  step1Buttons.push({ id: 'CMD_MAIN_MENU', title: '🔙 إلغاء والعودة للبداية' });

  await sendSmartInteractive(jid, intro, step1Buttons, 'اختر', lastMsg);
}

async function processBookingStep(jid, session, input, lastMsg) {
  if (input === 'CUSTOM_INPUT') {
    session.waitingCustomInput = true;
    await sendSmartInteractive(
      jid,
      `✍️ *تفضل بكتابة التفاصيل التي تود توضيحها بيدك في رسالة الآن، وسأقوم بتسجيلها كما هي:*`,
      [{ id: 'CMD_MAIN_MENU', title: '🔙 إلغاء والعودة للبداية' }],
      'اختر',
      lastMsg
    );
    return;
  }

  session.waitingCustomInput = false;
  const step = session.step;

  // -------------------- الخطوة 1: الاسم (وفحص الرقم المخفي باليوزر نيم) --------------------
  if (step === 1) {
    let chosenName = input;
    if (input.startsWith('USE_NAME_')) {
      chosenName = input.replace('USE_NAME_', '');
    }
    session.bookingData.name = chosenName;

    // إذا كان الواتساب قد قرأ الرقم بالفعل لا نسأله عن الرقم نهائياً!
    // أما إذا كان المريض يخفي رقمه ويستخدم الـ Username فقط، نطلبه منه في خطوة مستقلة:
    if (!session.bookingData.phone) {
      session.step = 1.5;
      await sendSmartInteractive(
        jid,
        `تشرفنا بحضرتك يا أستاذ/ة *${session.bookingData.name}* 🙏\n\n📱 *خطوة إضافية سريعة:*\nنظراً لأن حسابك على واتساب مفعل خاصية *اليوزر نيم وإخفاء الرقم*، من فضلك اكتب *رقم موبايلك (11 رقم)* في رسالة الآن لنتمكن من التواصل معك وتأكيد موعدك:`,
        [{ id: 'CMD_MAIN_MENU', title: '🔙 إلغاء والعودة للبداية' }],
        'اختر',
        lastMsg
      );
      return;
    }

    session.step = 2;
    await askBookingStep2Area(jid, session, lastMsg);
    return;
  }

  // خطوة مستقلة فقط لمن يخفي رقمه باليوزر نيم
  if (step === 1.5) {
    const digits = input.replace(/\D/g, '');
    session.bookingData.phone = digits || input;
    session.cleanPhone = session.bookingData.phone;
    session.step = 2;
    await askBookingStep2Area(jid, session, lastMsg);
    return;
  }

  // -------------------- الخطوة 2: المنطقة / البلد --------------------
  if (step === 2) {
    const areaMap = {
      'AREA_1': 'منشية النور',
      'AREA_2': 'قرية مجاورة لمنشية النور (الشموت / كفر مويس / ميت عاصم / عزبة زكي / الفاروقية وما حولها)',
      'AREA_3': 'مدينة بنها ذات نفسها (الأهرام / الفلل / المنشية / وسط البلد)',
      'AREA_4': 'قرية تابعة لمركز بنها',
      'AREA_5': 'من خارج بنها (داخل محافظة القليوبية)',
      'AREA_6': 'من خارج محافظة القليوبية (محافظة أخرى)'
    };
    session.bookingData.area = areaMap[input] || input;
    session.step = 3;

    await sendSmartInteractive(
      jid,
      `منورنا يا أهلنا الكرام 🌟\n\n*الخطوة 3 من 4:*\nهل سبق لك زيارة طبيب أسنان من قبل؟ وما أكثر شيء يشغل بالك في زيارتك القادمة؟\n💡 *(اختر من القائمة بالأسفل، أو اكتب بيدك في الشات مباشرة ما تشعر به أو ترغب في توضيحه للدكتور)* 👇`,
      [
        { id: 'FEAR_1', title: '💉 القلق من الألم أو البنج' },
        { id: 'FEAR_2', title: '💰 معرفة خطة العلاج والتكلفة مسبقاً' },
        { id: 'FEAR_3', title: '🦷 الرغبة في علاج الضرس وعدم خلعه' },
        { id: 'FEAR_4', title: '😟 لدي تجربة سابقة غير مريحة' },
        { id: 'FEAR_5', title: '😊 مطمئن تماماً الحمد لله' },
        { id: 'CUSTOM_INPUT', title: '✍️ أخرى (اكتب بنفسك بالتفصيل)' },
        { id: 'CMD_MAIN_MENU', title: '🔙 إلغاء والعودة للبداية' }
      ],
      '💭 اختر أو اكتب في الشات',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 3: المخاوف والتجربة السابقة --------------------
  if (step === 3) {
    const fearMap = {
      'FEAR_1': 'القلق من الألم أو البنج',
      'FEAR_2': 'معرفة خطة العلاج والتكلفة مسبقاً',
      'FEAR_3': 'الرغبة في الحفاظ على الضرس وعدم خلعه',
      'FEAR_4': 'تجربة سابقة غير مريحة عند طبيب أسنان',
      'FEAR_5': 'مطمئن تماماً الحمد لله'
    };
    const chosenFear = fearMap[input] || input;
    session.bookingData.prevVisitAndFear = chosenFear;
    session.step = 4;

    let reassure = `🌟 *رسالة اطمئنان لك من د. أحمد سلامة:*\n`;
    if (chosenFear.includes('الألم') || chosenFear.includes('الوجع')) {
      reassure += `اطمئن تماماً؛ نستخدم جل مخدر موضعي على اللثة قبل البنج، ولا نبدأ أي إجراء إلا بعد التأكد التام من التخدير الكامل وراحتك.`;
    } else if (chosenFear.includes('التكلفة')) {
      reassure += `حقك الكامل؛ في عيادة سلامتك نجلس معك في جلسة تشخيص وخطة علاج بعد الكشف لتوضيح كل الخطوات والتكلفة قبل البدء، والكشف يُدفع أول مرة فقط مع إتاحة تقسيط تكلفة الجلسات.`;
    } else if (chosenFear.includes('خلع')) {
      reassure += `اطمئن، أولويتنا القصوى في عيادة سلامتك هي الحفاظ على ضرسك الطبيعي وعلاجه بأحدث أجهزة الأشعة الديجيتال والروتاري طالما هناك فرصة لإنقاذه.`;
    } else if (chosenFear.includes('تجربة')) {
      reassure += `نعدك بأن زيارتك لعيادة سلامتك ستكون تجربة مريحة ومختلفة تماماً، مع شرح هادئ لكل خطوة وتعقيم طبي متكامل يُفتح أمامك.`;
    } else {
      reassure += `نسعد دائماً بثقتك الغالية ونتشرف بخدمتك على أعلى مستوى طبي.`;
    }

    await sendSmartInteractive(
      jid,
      `${reassure}\n\n*الخطوة 4 والأخيرة:*\nكيف تعرفت على *عيادة سلامتك*؟\n💡 *(يمكنك الاختيار من الزر بالأسفل، أو كتابة التفاصيل بيدك في الشات مباشرة — مثل كتابة اسم الصديق أو القريب الذي رشح لك العيادة لنشكره!)* 👇`,
      [
        { id: 'SRC_1', title: '📱 عن طريق السوشيال ميديا' },
        { id: 'SRC_2', title: '🤝 ترشيح وتوصية من قريب أو صديق' },
        { id: 'SRC_3', title: '🏘️ من أهل المنطقة' },
        { id: 'SRC_4', title: '✨ قدراً أو بالصدفة' },
        { id: 'CUSTOM_INPUT', title: '✍️ كتابة اسم من رشح لك العيادة بنفسك' },
        { id: 'CMD_MAIN_MENU', title: '🔙 إلغاء والعودة للبداية' }
      ],
      '📢 كيف تعرفت على العيادة؟',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 4 والأخيرة: إتمام الحجز وإرسال الملخص النهائي --------------------
  if (step === 4) {
    const sourceMap = {
      'SRC_1': 'عن طريق السوشيال ميديا',
      'SRC_2': 'عن طريق ترشيح وتوصية من قريب أو صديق',
      'SRC_3': 'من أهل المنطقة',
      'SRC_4': 'قدراً أو بالصدفة'
    };
    session.bookingData.source = sourceMap[input] || input;
    session.mode = 'MAIN_MENU';
    session.step = 0;

    // تنظيف آخر خطوة تمهيدية بعد 5 ثوانٍ
    cleanPreviousStepAfter5Seconds(jid, session, lastMsg);

    const d = session.bookingData;
    const finalPhone = d.phone || session.cleanPhone || 'مسجل بالمحادثة';

    // 1. رسالة تأكيد الحجز النهائية التي تصل للمريض وتبقى مسجلة في المحادثة (لا تُمسح أبداً!)
    const summaryForPatient =
      `✅ *بطاقة تأكيد الحجز النهائي — ${CLINIC_INFO.name}*\n` +
      `👨‍⚕️ *${CLINIC_INFO.doctor}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 *اسم المريض:* ${d.name}\n` +
      `📱 *رقم الموبايل:* ${finalPhone}\n` +
      `📍 *المنطقة / البلد:* ${d.area}\n` +
      `💭 *ملاحظات المريض:* ${d.prevVisitAndFear}\n` +
      `📢 *عرف العيادة عن طريق:* ${d.source}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🕒 *مواعيد العمل:* ${CLINIC_INFO.hours}\n` +
      `💳 *ملاحظة:* الكشف يُدفع أول مرة فقط، ومتاح الدفع كاش أو فودافون كاش أو إنستا باي.\n` +
      `🏢 *العنوان:* ${CLINIC_INFO.address}\n` +
      `🗺️ *اللوكيشن:* ${CLINIC_INFO.mapsUrl}\n` +
      `📞 *تليفون العيادة:* ${CLINIC_INFO.phone}`;

    await sendSmartInteractive(
      jid,
      summaryForPatient,
      [
        { id: 'CMD_SHOW_FULL_MENU', title: '🏠 القائمة الرئيسية' },
        { id: 'CMD_HUMAN_CHAT', title: '👨‍⚕️ التحدث مع د. أحمد مباشرة' }
      ],
      'اختر',
      null,
      true // keepForever = true (تظل مسجلة عند المريض وعند الدكتور!)
    );

    // 2. إرسال بطاقة الحجز النهائية إلى رقم الدكتور الأساسي (My Number)
    const waLinkPhone = finalPhone.startsWith('01') ? `2${finalPhone}` : '';
    const doctorSummary =
      `🔔 *رسالة حجز نهائي جديدة — عيادة سلامتك*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 *اسم المريض:* ${d.name}\n` +
      `📱 *رقم موبايل المريض:* ${finalPhone}\n` +
      `📍 *المنطقة / البلد:* ${d.area}\n` +
      `💭 *ملاحظات المريض:* ${d.prevVisitAndFear}\n` +
      `📢 *عرف العيادة عن طريق:* ${d.source}\n` +
      `━━━━━━━━━━━━━━━\n` +
      (waLinkPhone ? `💬 *للتواصل المباشر مع المريض:* https://wa.me/${waLinkPhone}` : '');

    try {
      await sock.sendMessage(DOCTOR_JID, { text: doctorSummary });
    } catch (err) {
      console.error('Error sending summary to doctor number:', err.message);
    }
  }
}

async function askBookingStep2Area(jid, session, lastMsg) {
  await sendSmartInteractive(
    jid,
    `تشرفنا بحضرتك يا أستاذ/ة *${session.bookingData.name}* 🙏\n\n*الخطوة 2 من 4:*\nحضرتك مشرفنا من أي منطقة أو بلد؟\n💡 *(اختر من القائمة بالأسفل، أو اكتب اسم منطقتك أو قريتك بالتفصيل في الشات مباشرة)* 👇`,
    [
      { id: 'AREA_1', title: '📍 1. منشية النور', desc: 'منشية النور وأول شارع الشموت ومحيط العيادة' },
      { id: 'AREA_2', title: '📍 2. قرية مجاورة لمنشية النور', desc: 'الشموت، كفر الشموت، كفر مويس، ميت عاصم، عزبة زكي، الفاروقية، نجيب، الرمالي، الميتيني' },
      { id: 'AREA_3', title: '📍 3. مدينة بنها ذات نفسها', desc: 'الأهرام، الفلل، المنشية، وسط البلد، الشدية، بنها الجديدة' },
      { id: 'AREA_4', title: '📍 4. قرية تابعة لمركز بنها', desc: 'شبلنجة، مرصفا، سندنهور، ورورة، نقباس، ميت العطار، دجوي، طحلة، بتمدة، بطا، كفر الجزار' },
      { id: 'AREA_5', title: '📍 5. من خارج بنها (داخل القليوبية)', desc: 'طوخ، كفر شكر، شبين القناطر، قليوب، قها، الخانكة، القناطر' },
      { id: 'AREA_6', title: '📍 6. من خارج محافظة القليوبية', desc: 'محافظة أخرى خارج القليوبية' },
      { id: 'CUSTOM_INPUT', title: '✍️ كتابة اسم البلد أو المنطقة بنفسك', desc: 'اضغط هنا لكتابة اسم منطقتك أو قريتك بالظبط' },
      { id: 'CMD_MAIN_MENU', title: '🔙 إلغاء والعودة للبداية', desc: 'الرجوع للبداية وإلغاء الحجز' }
    ],
    '📍 اختر المنطقة أو اكتبها بالشات',
    lastMsg
  );
}

// ==================== تشغيل اتصال واتساب وكود الربط ====================
async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  });

  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        console.log('جاري طلب كود الربط بالهاتف من سيرفرات واتساب...');
        const pairingCode = await sock.requestPairingCode(DOCTOR_NUMBER);
        console.log('\n==================================================');
        console.log(`🔑 كود الربط بالهاتف هو: ${pairingCode}`);
        console.log('==================================================\n');
        connectionStatus = `🔑 كود الربط الخاص بك: ${pairingCode}`;
      } catch (err) {
        console.error('Pairing code error:', err.message || err);
      }
    }, 4000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      latestQrDataUrl = await QRCode.toDataURL(qr);
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      }
    } else if (connection === 'open') {
      latestQrDataUrl = null;
      connectionStatus = '✅ البوت الذكي V4 متصل الآن ويعمل بنجاح 24/7!';
      console.log('\n==================================================');
      console.log('✅ البوت الذكي V4 متصل الآن ويعمل بنجاح 24/7!');
      console.log('==================================================\n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') continue;

      const pushName = msg.pushName || '';

      const innerMsg =
        msg.message.viewOnceMessage?.message ||
        msg.message.ephemeralMessage?.message ||
        msg.message.viewOnceMessageV2?.message ||
        msg.message;

      let textOrId =
        innerMsg.conversation ||
        innerMsg.extendedTextMessage?.text ||
        innerMsg.buttonsResponseMessage?.selectedButtonId ||
        innerMsg.buttonsResponseMessage?.selectedDisplayText ||
        innerMsg.listResponseMessage?.singleSelectReply?.selectedRowId ||
        innerMsg.listResponseMessage?.title ||
        innerMsg.templateButtonReplyMessage?.selectedId ||
        innerMsg.templateButtonReplyMessage?.selectedDisplayText ||
        '';

      const interactiveResp = innerMsg.interactiveResponseMessage;
      if (!textOrId && interactiveResp) {
        try {
          const params = JSON.parse(interactiveResp.nativeFlowResponseMessage?.paramsJson || '{}');
          textOrId = params.id || params.title || params.display_text || interactiveResp.body?.text || '';
        } catch (e) {
          textOrId = interactiveResp.body?.text || '';
        }
      }

      if (textOrId) {
        await handlePatientInput(remoteJid, textOrId, msg, pushName);
      }
    }
  });
}

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="refresh" content="5" />
      <title>بوت عيادة سلامتك الذكي V4</title>
      <style>
        body { font-family: Tahoma, Arial, sans-serif; background: #f0fdf4; color: #064e3b; text-align: center; padding: 25px; }
        .card { max-width: 440px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 25px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border: 2px solid #10b981; }
        .status { padding: 14px; border-radius: 12px; background: #ecfdf5; font-weight: bold; margin: 15px 0; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🦷 بوت عيادة سلامتك الذكي (V4)</h2>
        <p>د. أحمد سلامة أبوالفتوح</p>
        <div class="status">${connectionStatus}</div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  startWhatsAppBot();
});
