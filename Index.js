/**
 * بوت واتساب الذكي المتكامل (الإصدار الاحترافي V3)
 * عيادة سلامتك لطب الفم وتجميل الأسنان — د. أحمد سلامة أبوالفتوح
 *
 * المميزات المدمجة:
 * 1. ترحيب ذكي باسم المريض المسجل في حسابه على واتساب تلقائياً.
 * 2. أزرار وقوائم تفاعلية كاملة واضحة بدون تقطيع حروف وبدون تكرار عناوين.
 * 3. عمل زر "القائمة الرئيسية" و"إلغاء الحجز" في أي لحظة بنسبة 100% بدون تداخل.
 * 4. خيار "أخرى / اكتب بنفسك" في كل سؤال + فهم ذكي لما يكتبه المريض بيده.
 * 5. عرض تفاصيل الخدمة كاملة للمريض أثناء الحجز بمجرد اختيارها.
 * 6. خاصية Auto-Delete: مسح كافة الرسائل والخطوات التمهيدية تلقائياً والإبقاء فقط على رسالة الحجز النهائية عند المريض وعند الدكتور.
 * 7. إصلاح استخراج رقم الموبايل الحقيقي للمريض في ملخص الحجز النهائي.
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

// رقم واتساب الدكتور الأساسي لاستلام ملخص الحجز النهائي
const DOCTOR_NUMBER = '201559004796';
const DOCTOR_JID = `${DOCTOR_NUMBER}@s.whatsapp.net`;

const CLINIC_INFO = {
  name: 'عيادة سلامتك لطب الفم وتجميل الأسنان',
  doctor: 'د. أحمد سلامة أبوالفتوح',
  title: 'أخصائي جراحة الفم وتجميل الأسنان بجامعة عين شمس',
  address: 'بنها - عزبة السوق - أول شارع الشموت - عمارة خشالة - أعلى موقف السوزوكي',
  mapsUrl: 'https://maps.app.goo.gl/d1ZiMy4BAAGX7DEr5?g_st=ac',
  fbUrl: 'https://www.facebook.com/share/19fa9SWc3Q/',
  phone: '01559004796',
  hours: 'جميع أيام الأسبوع ما عدا الجمعة — من الساعة 3:00 عصراً حتى 10:00 مساءً'
};

// قائمة خدمات العيادة الـ 12 بعناوين واضحة وكاملة غير مقطوعة
const SERVICES_DATA = [
  {
    id: 'SRV_1',
    title: '🩺 الكشف والتشخيص المتكامل',
    desc: 'فحص شامل للأسنان واللثة وجلسة خطة علاج (يدفع أول مرة فقط)',
    details: `🩺 *1. الكشف والتشخيص المتكامل في عيادة سلامتك*\n\nمش مجرد بصّة سريعة! الكشف عندنا شامل:\n✅ *فحص كامل للفم والأسنان واللثة:* بنفحص كل الأسنان عشان نلحق أي تسوس في أوله قبل ما يكبر.\n✅ *جلسة خطة علاج وتشخيص مع د. أحمد سلامة:* الدكتور بيقعد معاك يشرح لك حالة أسنانك بالراحة وبكل أمانة، وإيه الضروري اللي يتعمل الأول وإيه اللي ممكن يتأجل.\n✅ *رسم خطة علاج واضحة:* بتعرف كل خطوة وتكلفتها قبل ما نبدأ بدون أي مفاجآت.\n\n🎁 *ميزة خاصة جداً لمرضانا:*\nأنت بتدفع الكشف في أول زيارة فقط! بعد كده كل الاستشارات، المتابعات، وجلسات العلاج بتكون *مجاناً بدون أي رسوم كشف تانية* (بتدفع تكلفة العلاج فقط).`
  },
  {
    id: 'SRV_2',
    title: '📸 الأشعة الديجيتال الفورية',
    desc: 'تصوير فوري بالسنسور والبورتابل وأنت على الكرسي',
    details: `📸 *2. الأشعة الديجيتال الفورية والسنسور (Portable X-Ray & Sensor)*\n\nفي عيادة سلامتك مبنشتغلش عمياني! الخدمة شاملة:\n✅ *تصوير فوري وأنت قاعد على الكرسي:* بجهاز البورتابل والسنسور الحديث من غير ما تقوم أو تروح مركز أشعة بره.\n✅ *صورة مكبرة فائقة الوضوح على الشاشة:* دكتور أحمد بيوريك بنفسك شكل الجذور والتسوس المخفي تحت اللثة أو بين الدروس.\n✅ *أمان تام 100%:* إشعاع لا يُذكر وآمن جداً للأطفال والكبار.`
  },
  {
    id: 'SRV_3',
    title: '🦷 حشو العصب المتكامل والدعامة',
    desc: 'شامل الأشعة وتطهير الجذور والدعامة والحشو الدائم + تقسيط الدفع',
    details: `🦷 *3. حشو العصب المتكامل (شامل كل حاجة من الألف للياء)*\n\nفي عيادة سلامتك الخدمة شاملة *7 خطوات كاملة* بدون مصاريف مخفية:\n1️⃣ *الأشعة الديجيتال (قبل وأثناء وبعد الحشو):* عشان نطمن إن الجذور اتنظفت واتقفلت لآخر ملي.\n2️⃣ *التخدير الموضعي القوي:* بنج جل الأول وبعده بنج مستورد عشان متحسش بأي وجع.\n3️⃣ *إزالة التسوس بالكامل:* تنظيف الضرس من كل البكتيريا والتسوس.\n4️⃣ *سحب العصب وتطهير الجذور بالروتاري:* بأحدث الأجهزة والمحاليل المطهرة لمنع أي خراج أو ألم مستقبلاً.\n5️⃣ *حشو القنوات العصبية بالكامل:* بأحدث الخامات الطبية.\n6️⃣ *تركيب الدعامة (الوتد):* لتقوية الضرس وتدعيمه عشان ميتكسرش مع الأكل.\n7️⃣ *الحشو الدائم النهائي فوق الضرس:* بناء الضرس يرجع سليم يمضغ طبيعي، مع تعليمات الحفاظ عليه.\n\n💳 *مفاجأة عشان متشلش هم التكلفة:*\nلو مش معاك التكلفة كاملة دلوقتي، اطمن خالص! الشغل بيتعمل على جلسات، وتقدر *تقسم التكلفة وتدفع جزء بسيط مع كل جلسة* (كاش أو فودافون كاش أو إنستا باي)، وكمان مفيش أي رسوم كشف في الجلسات!`
  },
  {
    id: 'SRV_4',
    title: '✨ الحشو العادي التجميلي (ليزر)',
    desc: 'حشو ضوئي تجميلي بنفس لون السنة الطبيعية شامل الأشعة',
    details: `✨ *4. الحشو العادي التجميلي (حشو ليزر شامل الأشعة)*\n\nلما نلحق التسوس قبل ما يوصل للعصب، الخدمة بتكون شاملة:\n✅ *أشعة ديجيتال قبل الحشو:* عشان نتأكد 100% إن التسوس بعيد عن العصب وميوجعكش بعدين.\n✅ *تنظيف التسوس بدقة:* إزالة التسوس بالكامل مع الحفاظ على جسم الضرس السليم.\n✅ *حشو ليزر (ضوئي) تجميلي أصلي:* خامات حديثة عالية القوة وبنفس لون وشكل سنتك الطبيعية بالظبط كأنها متلمستش.\n✅ *تلميع الحشو وتظبيط العضة:* عشان تاكل وتمضغ عليه براحتك في نفس اليوم.`
  },
  {
    id: 'SRV_5',
    title: '🧼 تنظيف الجير وتلميع الأسنان',
    desc: 'إزالة الجير والتصبغات بالموجات فوق الصوتية وعلاج رائحة الفم',
    details: `🧼 *5. تنظيف الجير وتلميع الأسنان المتكامل*\n\nالجلسة عندنا شاملة:\n✅ *إزالة التكتلات الجيرية بالكامل:* بجهاز الموجات فوق الصوتية (Ultrasonic) الحديث اللي بيكسر الجير بلطف بدون ما يجرح اللثة أو يضعف مينا الأسنان.\n✅ *إزالة التصبغات السطحية:* تنظيف آثار الشاي والقهوة والسجاير.\n✅ *تلميع الأسنان (Polishing):* بفرشاة ومعجون طبي خاص ينعم سطح الأسنان ويرجع لمعتها الطبيعية.\n✅ *جلسة تعليم غسيل الأسنان مع د. أحمد:* بعد ما نخلص، الدكتور بيعلمك إزاي تغسل أسنانك بالطريقة العلمية الصح عشان الجير ميرجعش تاني.`
  },
  {
    id: 'SRV_6',
    title: '🌸 كحت وتنظيف الجيوب اللثوية',
    desc: 'تنظيف عميق للجيوب اللثوية وعلاج نزيف والتهابات اللثة',
    details: `🌸 *6. كحت وتنظيف الجيوب اللثوية العميق*\n\nلو بتعاني من جيوب لثوية بتحشر أكل أو بتنزف وتورم باستمرار، الخدمة شاملة:\n✅ *تخدير موضعي مريح للثة.*\n✅ *تنظيف وكحت عميق للجيوب اللثوية:* إزالة الجير والبكتيريا المستخبية تحت اللثة وحوالين الجذور.\n✅ *تنعيم سطح الجذور:* عشان اللثة ترجع تقفل وتمسك في الضرس بقوة.\n✅ *غسول ومطهرات طبية داخل الجيوب:* مع خطة علاج ومتابعة مجانية لحد ما اللثة تخف تماماً.`
  },
  {
    id: 'SRV_7',
    title: '🩺 الخلع العادي والجراحي وضرس العقل',
    desc: 'خلع آمن بدون ألم لبقايا الجذور وضروس العقل المدفونة',
    details: `🩺 *7. قسم الجراحة والخلع الآمن (عادي / ضرس العقل / بقايا الجذور / جراحي)*\n\nفي عيادة سلامتك مبنخلعش غير الضرس اللي مفيش منه أي أمل في العلاج، والخدمة شاملة:\n✅ *فحص وأشعة عند الحاجة:* عشان نشوف شكل الجذور ووضع ضرس العقل تحت اللثة.\n✅ *بنج قوي ومضمون 100%:* جل مخدر الأول وبعده بنج قوي (مع إمكانية تزويد كربولة بنج إضافية للحالات الصعبة أو الالتهاب الشديد) ومبنلمسش الضرس غير لما تتأكد بنفسك إنه تخدر تماماً.\n✅ *خلع هادئ بأدوات حديثة:* بدون عنف وبدون أذية لعظم الفك أو اللثة.\n✅ *تنظيف الجرح ووضع قطنة معقمة + تعليمات كاملة:* دكتور أحمد بيفهمك بالتفصيل تعمل إيه في البيت عشان الجرح يلم بسرعة ومن غير وجع.`
  },
  {
    id: 'SRV_8',
    title: '👑 التركيبات الثابتة (زيركون وبورسلين)',
    desc: 'طرابيش وكباري زيركون وبورسلين ولزق الطرابيش بأعلى دقة',
    details: `👑 *8. التركيبات الثابتة الحديثة (طربوش زيركون / طربوش بورسلين / لزق طربوش)*\n\nلحماية الضرس بعد حشو العصب من الكسر، أو لتعويض ضرس مخلوع وتجميل الابتسامة، الخدمة شاملة:\n✅ *تحضير الضرس بدقة عالية:* بأقل برد ممكن للحفاظ على قوة الضرس.\n✅ *أخذ مقاسات دقيقة جداً:* عشان الطربوش ينزل مرسوم على اللثة وميحشرش أكل ولا يعمل ريحة.\n✅ *أحدث خامات البورسلين والزيركون:* الزيركون عندنا بيتميز بقوة تحمل حديدية في المضغ ولون طبيعي وشفافية زي الأسنان الحقيقية بالظبط.\n✅ *اللزق الطبي الثابت وتظبيط العضة + تقسيط الدفع:* تدفع جزء وقت المقاس والجزء التاني عند الاستلام والتركيب!`
  },
  {
    id: 'SRV_9',
    title: '😁 التركيبات المتحركة (أكريل وفليكس)',
    desc: 'طقم كامل أو نصف طقم أو سنة متحركة عادية وفليكس مرن',
    details: `😁 *9. التركيبات المتحركة المريحة (أكريل عادي & فليكس مرن)*\n\nمتوفر عندنا كل الحلول لتعويض الأسنان المفقودة (طقم كامل أكريل، نصف طقم عادي أو فليكس، سنة متحركة بارشيال أو فليكس)، والخدمة شاملة:\n✅ *مقاسات دقيقة على خطوات:* لضمان ثبات الطقم في الفم وميقعش وأنت بتتكلم أو بتاكل.\n✅ *خيار الفليكس (المرن) الحديث:* طري ومريح جداً على اللثة، ضد الكسر، وبدون أي مشابك حديد تبان في ابتسامتك.\n✅ *جلسة بروفة قبل التسليم النهائي:* عشان تطمن على الشكل واللون والراحة.\n✅ *متابعة مجانية بعد الاستلام:* لأي تظبيط أو تنعيم، مع تعليمك إزاي تنظفه وتحافظ عليه.`
  },
  {
    id: 'SRV_10',
    title: '🔩 زراعة الأسنان الحديثة',
    desc: 'تعويض الأسنان المفقودة بزرعات تيتانيوم أصلية بدون برد الأسنان',
    details: `🔩 *10. زراعة الأسنان (أحدث وأفضل تعويض للضرس المفقود)*\n\nبدل ما نبرد الأسنان السليمة اللي جنب المكان الفاضي، زراعة الأسنان بترجع لك ضرسك كأنه طبيعي، والخدمة شاملة:\n✅ *فحص شامل وتقييم عظم الفك بالأشعة.*\n✅ *زرعة تيتانيوم أصلية عالية الجودة:* بتلتحم مع عظم الفك وتعيش معاك العمر كله بإذن الله.\n✅ *إجراء بسيط وآمن تحت البنج الموضعي:* بدون ألم وفي وقت قصير تحت إشراف د. أحمد سلامة أخصائي جراحة الفم بجامعة عين شمس.\n✅ *متابعة التئام الزرعة وتركيب الطربوش النهائي:* مع تسهيلات في الدفع على مراحل الزراعة والتركيب.`
  },
  {
    id: 'SRV_11',
    title: '🧒 قسم أسنان الأطفال المتكامل',
    desc: 'حشو عصب أطفال، طربوش معدن، خلع لطيف، وحافظ مسافة',
    details: `🧒 *11. قسم أسنان الأطفال المتكامل (عشان ابنك يحب دكتور الأسنان!)*\n\nبنعامل طفلك بحنية وهدوء تام عشان يطلع بيحب يروح لدكتور الأسنان، والقسم شامل:\n✅ *بنج جل بطعم الفواكه قبل أي إجراء:* عشان الطفل ميحسش بشكة البنج.\n✅ *حشو عصب أطفال + طربوش معدن للأطفال:* بنعالج الضرس اللبني ونركب له طربوش يحميه لحد ميعاد التبديل الطبيعي.\n✅ *خلع أطفال لطيف + حافظ مسافة (Space Maintainer):* لو الضرس اللبني اضطرينا نخلعه بدري، بنركب "حافظ مسافة" يحجز مكان الضرس الدائم عشان الأسنان متدخلش على بعضها وميحتاجش تقويم غالي لما يكبر.\n✅ *هدية تشجيعية وتعليم الطفل:* دكتور أحمد بيعلم الطفل بنفسه إزاي يغسل أسنانه بالفرشاة صح ويبعد عن التسوس.`
  },
  {
    id: 'SRV_12',
    title: '🍼 طب أسنان الرضع وحديثي الولادة',
    desc: 'الوقاية والعلاج المبكر لتسوس الرضاعة وإرشادات الأمهات',
    details: `🍼 *12. قسم طب أسنان الأطفال الرضع وحديثي الولادة (الوقاية من تسوس الرضاعة)*\n\nفي عيادة سلامتك بنهتم بطفلك من أول يوم ولادة، وبنساعد كل أم تحمي رضيعها من *تسوس الرضاعة* بتعديل بعض العادات اليومية البسيطة:\n\n1️⃣ *تنظيم أوقات الرضاعة الليلية:* نحاول نقلل الرضاعة أثناء النوم بالليل، وحتى بعد الرضاعة الليلية لازم الأم تمسح أسنان ولثة الطفل بقطعة *شاش طبي مبللة بالمية*.\n2️⃣ *الفطام عن الببرونة:* نحاول نفطم الطفل عن الببرونة، أو لو مش هنقدر نحط فيها *مية فقط* بدل اللبن أو العصير المسكر وقت النوم.\n3️⃣ *ممنوع مشاركة المعلقة مع الطفل:* معلقة الطفل تكون خاصة بيه بس؛ مينفعش الأم تحط المعلقة في بقها وترجع تنقلها لفم الطفل لأن ده بينقل البكتيريا المسببة للتسوس مباشرة للطفل!\n4️⃣ *غسيل أسنان الرضيع مرتين يومياً:* باستخدام *فرشاة السيليكون* اللي بتتلبس في صباع الأم، مع معجون أسنان أطفال فيه فلورايد ويكون *حجم المعجون أقل من حبة الأرز*.\n5️⃣ *العلاج المبكر لأي تسوس:* لو حصل تسوس لازم نتوجه للعيادة فوراً عشان دكتور أحمد يحدد إزاي نسيطر عليه بدري؛ لأن أي تسوس أو وجع عند الأطفال بيخليهم يزهدوا ويبعدوا عن الأكل، وده بيسبب إنهم مبياخدوش احتياجهم من العناصر الغذائية في أهم فترة من فترات حياتهم وبالتالي ممكن يسبب مشكلة تأثر عليهم طول حياتهم.`
  }
];

const userSessions = new Map();
let sock = null;
let latestQrDataUrl = null;
let connectionStatus = 'جاري تهيئة البوت...';

/**
 * استخراج رقم موبايل مصري سليم من بيانات الرسالة (يتغلب على مشكلة @lid)
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
    if (String(cand).endsWith('@lid')) continue;
    const raw = String(cand).split('@')[0].split(':')[0].replace(/\D/g, '');
    if (raw.startsWith('201') && raw.length === 12) {
      return '0' + raw.substring(2); // يحول 201559004796 إلى 01559004796
    }
    if (raw.startsWith('01') && raw.length === 11) {
      return raw;
    }
    if (raw.length >= 10 && raw.length <= 13) {
      return '+' + raw;
    }
  }
  return null;
}

/**
 * دالة Auto-Delete: تمسح الرسائل التمهيدية السابقة من المحادثة
 * بحيث لا يتبقى في الشات في النهاية إلا رسالة الحجز النهائي فقط
 */
/**
 * جدولة مسح تلقائي بعد دقيقة واحدة (60 ثانية) لأي رسالة خاصة بالبوت أو اختيارات العميل مع البوت
 * بحيث تختفي تماماً من عند العميل ومن عند الدكتور ولا يتبقى في الشات إلا المحادثة البشرية العادية ورسالة الحجز النهائي
 */
function scheduleOneMinuteAutoDelete(jid, botMsgKey, userIncomingMsg) {
  setTimeout(async () => {
    // 1. مسح رسالة البوت لدى الطرفين (تختفي من عند المريض ومن عند الدكتور)
    if (botMsgKey) {
      try {
        await sock.sendMessage(jid, { delete: botMsgKey });
      } catch (e) {}
    }

    // 2. مسح اختيار أو رسالة العميل الموجهة للبوت من سجل المحادثة
    if (userIncomingMsg && userIncomingMsg.key) {
      try {
        await sock.sendMessage(jid, { delete: userIncomingMsg.key });
      } catch (e) {}
      try {
        await sock.chatModify(
          {
            clear: {
              messages: [
                {
                  id: userIncomingMsg.key.id,
                  fromMe: userIncomingMsg.key.fromMe,
                  timestamp: userIncomingMsg.messageTimestamp || Math.floor(Date.now() / 1000)
                }
              ]
            }
          },
          jid
        );
      } catch (e) {}
    }
  }, 60 * 1000); // 60 ثانية (دقيقة واحدة)
}

/**
 * مسح فوري للخطوة السابقة عند انتقال العميل للخطوة التالية
 */
async function autoDeletePreviousMessages(jid, session) {
  if (!session) return;

  if (session.botMsgKeys && session.botMsgKeys.length > 0) {
    const keysToDelete = [...session.botMsgKeys];
    session.botMsgKeys = [];
    for (const key of keysToDelete) {
      try {
        await sock.sendMessage(jid, { delete: key });
      } catch (e) {}
    }
  }

  if (session.userMsgs && session.userMsgs.length > 0) {
    const msgsToClear = [...session.userMsgs];
    session.userMsgs = [];
    for (const m of msgsToClear) {
      try {
        await sock.readMessages([m.key]);
        await sock.chatModify(
          {
            clear: {
              messages: [
                {
                  id: m.key.id,
                  fromMe: m.key.fromMe,
                  timestamp: m.messageTimestamp || Math.floor(Date.now() / 1000)
                }
              ]
            }
          },
          jid
        );
      } catch (e) {}
    }
  }
}

/**
 * إرسال رسالة تفاعلية بأزرار احترافية مع تفعيل المسح التلقائي بعد دقيقة واحدة (60 ثانية)
 * وبدون نقل المحادثة للأرشيف نهائياً
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

  // مسح الخطوة السابقة فوراً
  await autoDeletePreviousMessages(jid, session);

  if (lastIncomingMsg && lastIncomingMsg.key && !keepForever) {
    session.userMsgs = session.userMsgs || [];
    session.userMsgs.push(lastIncomingMsg);
  }

  if (!items || items.length === 0) {
    const sent = await sock.sendMessage(jid, { text });
    if (sent && sent.key && !keepForever) {
      session.botMsgKeys.push(sent.key);
      scheduleOneMinuteAutoDelete(jid, sent.key, lastIncomingMsg);
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
      scheduleOneMinuteAutoDelete(jid, interactiveMsg.key, lastIncomingMsg);
    }
  } catch (err) {
    console.error('Fallback send error:', err.message);
    const sentFallback = await sock.sendMessage(jid, { text });
    if (sentFallback && sentFallback.key && !keepForever) {
      session.botMsgKeys.push(sentFallback.key);
      scheduleOneMinuteAutoDelete(jid, sentFallback.key, lastIncomingMsg);
    }
  }
}

async function sendWelcomeMenu(jid, lastMsg = null, pushName = '') {
  let existing = userSessions.get(jid);
  if (existing) {
    await autoDeletePreviousMessages(jid, existing);
  }

  const cleanPhone = extractCleanPhoneNumber(lastMsg, jid);
  const patientDisplayName = pushName || existing?.pushName || 'ضيفنا العزيز';

  const session = {
    mode: 'WELCOME_CHOICE',
    step: 0,
    waitingCustomInput: false,
    pushName: patientDisplayName,
    cleanPhone: cleanPhone || existing?.cleanPhone || '',
    bookingData: {},
    botMsgKeys: [],
    userMsgs: []
  };
  userSessions.set(jid, session);

  const welcomeMsg =
    `أهلاً وسهلاً بحضرتك يا أستاذ/ة *${patientDisplayName}* 🌟
` +
    `نورتنا ومرحباً بك في *${CLINIC_INFO.name}* 🦷✨
` +
    `معاك المساعد الذكي لعيادة *${CLINIC_INFO.doctor}*
` +
    `(${CLINIC_INFO.title}) 👨‍⚕️

` +
    `🏥 *أولاً: مميزات عيادة سلامتك لطب وتجميل الأسنان:*
` +
    `✅ *الكشف بتدفعه أول مرة فقط!* وأي استشارات أو متابعات أو جلسات علاج بعد كده مجاناً بدون أي رسوم كشف جديدة.
` +
    `✅ *أشعة ديجيتال فورية وسنسور (Sensor & Portable X-Ray):* تصوير الضرس وأنت قاعد مستريح على الكرسي بدون ما تتحرك.
` +
    `✅ *جلسة خطة علاج وتشخيص قبل البدء:* د. أحمد سلامة بيقعد معاك يشرح لك حالة أسنانك وخطة العلاج كاملة قبل ما نبدأ.
` +
    `✅ *جلسة تعليم غسيل الأسنان والعناية بعد العلاج:* بعد انتهاء العلاج، الدكتور بيعلمك عملياً إزاي تحافظ على العلاج وتغسل أسنانك صح.
` +
    `✅ *خامات حديثة وتعقيم دولي وتقسيط مريح:* إمكانية تقسيط تكلفة الجلسات (كاش أو فودافون كاش أو إنستا باي).

` +
    `🤖 *ثانياً: مميزات المتابعة مع المساعد الذكي (بوت العيادة):*
` +
    `💡 *تثقيف طبي كامل لأسنانك:* هتعرف معلومات مهمة جداً عن أسنانك وإزاي تحمي نفسك وأطفالك من التسوس وتتجنب أي مضاعفات أو تكلفة زيادة مالهاش لازمة.
` +
    `🔍 *معرفة تفاصيل كل خدمة:* شرح كامل لكل خدمات العيادة الـ 12 وما تشمله خطوة بخطوة + إرشادات الطوارئ والحوادث.
` +
    `📅 *حجز فوري وتجهيز ملفك الطبي:* في أقل من دقيقة ليطلع عليه د. أحمد سلامة قبل زيارتك.

` +
    `👇 *اختر الآن كيف تحب أن نكمل معك:*
` +
    `1️⃣ *متابعة الكلام مع المساعد الذكي الخاص بعيادة سلامتك د. أحمد سلامة*
` +
    `2️⃣ *المتابعة والتحدث مع د. أحمد سلامة مباشرة*`;

  const choiceButtons = [
    { id: 'CMD_SHOW_FULL_MENU', title: '🤖 متابعة مع المساعد الذكي' },
    { id: 'CMD_HUMAN_CHAT', title: '👨‍⚕️ التحدث مع د. أحمد مباشرة' }
  ];

  await sendSmartInteractive(jid, welcomeMsg, choiceButtons, '👇 اختر طريقة المتابعة', lastMsg);
}

async function showFullMainMenu(jid, lastMsg = null) {
  let session = userSessions.get(jid);
  if (!session) {
    session = { mode: 'MAIN_MENU', step: 0, bookingData: {}, botMsgKeys: [], userMsgs: [] };
    userSessions.set(jid, session);
  }
  session.mode = 'MAIN_MENU';

  const menuMsg = `🦷 *القائمة الكاملة لخدمات عيادة سلامتك*
(د. أحمد سلامة أبوالفتوح) 👨‍⚕️

اضغط على الزر بالأسفل لاختيار الخدمة أو القسم المطلوب 👇`;

  const mainItems = [
    { id: 'MENU_BOOKING', title: '📅 حجز موعد أو استشارة' },
    { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة بالتفصيل' },
    { id: 'MENU_EMERGENCY', title: '🚨 حالات الطوارئ والحوادث' },
    { id: 'MENU_ROOT_CANAL', title: '💳 حشو العصب وتقسيط الدفع' },
    { id: 'MENU_WHY_US', title: '✨ ليه تختار عيادة سلامتك؟' },
    { id: 'MENU_PLEDGE', title: '🤝 عهد الأمانة من د. أحمد' },
    { id: 'MENU_AFTERCARE', title: '🪥 تعليمات بعد العلاج والغسيل' },
    { id: 'MENU_LOCATION', title: '📍 العنوان والمواعيد واللوكيشن' },
    { id: 'CMD_HUMAN_CHAT', title: '👨‍⚕️ التحدث مع د. أحمد مباشرة' }
  ];

  await sendSmartInteractive(jid, menuMsg, mainItems, '📋 القائمة الكاملة للعيادة', lastMsg);
}

/**
 * فهم ذكي للكلام الحر (AI Natural Language Router)
 */
function detectSmartIntent(text) {
  const t = text.toLowerCase();
  if (t.includes('قائمة') || t.includes('رئيسية') || t.includes('العودة') || t.includes('إلغاء') || t.includes('الغاء') || t === '0') {
    return 'CMD_MAIN_MENU';
  }
  if (t.includes('حجز') || t.includes('موعد') || t.includes('احجز')) {
    return 'MENU_BOOKING';
  }
  if (t.includes('طوارئ') || t.includes('حادث') || t.includes('وقعت') || t.includes('اتكسرت') || t.includes('تورم') || t.includes('خنقة') || t.includes('تنفس')) {
    return 'MENU_EMERGENCY';
  }
  if (t.includes('عصب') || t.includes('تقسيط') || t.includes('دفعات') || t.includes('فودافون') || t.includes('انستا')) {
    return 'MENU_ROOT_CANAL';
  }
  if (t.includes('عنوان') || t.includes('مكان') || t.includes('فين') || t.includes('مواعيد') || t.includes('لوكيشن') || t.includes('خريطة')) {
    return 'MENU_LOCATION';
  }
  if (t.includes('مميزات') || t.includes('اشعة') || t.includes('أشعة') || t.includes('تعقيم')) {
    return 'MENU_WHY_US';
  }
  if (t.includes('عهد') || t.includes('خايف') || t.includes('امانة') || t.includes('أمانة')) {
    return 'MENU_PLEDGE';
  }
  if (t.includes('تعليمات') || t.includes('غسيل') || t.includes('فرشاة')) {
    return 'MENU_AFTERCARE';
  }
  if (t.includes('خدمات') || t.includes('زراعة') || t.includes('طربوش') || t.includes('زيركون') || t.includes('جير') || t.includes('رضع') || t.includes('اطفال') || t.includes('أطفال')) {
    return 'MENU_SERVICES';
  }
  return null;
}

async function handlePatientInput(jid, rawIdOrText, lastMsg = null, pushName = '') {
  const input = (rawIdOrText || '').trim();
  if (!input) return;

  let session = userSessions.get(jid);
  const cleanPhone = extractCleanPhoneNumber(lastMsg, jid);
  if (session && cleanPhone) {
    session.cleanPhone = cleanPhone;
  }
  if (session && pushName && !session.pushName) {
    session.pushName = pushName;
  }

  // 1. فحص فوري شامل: إذا ضغط على "العودة للبوت الذكي" أو "القائمة الرئيسية" أو "متابعة مع المساعد الذكي" أو كتب "بوت" أو "0" في أي وقت (حتى لو كان في وضع المحادثة المباشرة!)
  if (
    input === 'CMD_SHOW_FULL_MENU' ||
    input.includes('متابعة مع المساعد الذكي') ||
    input.includes('المساعد الذكي')
  ) {
    await showFullMainMenu(jid, lastMsg);
    return;
  }

  if (
    input === 'CMD_MAIN_MENU' ||
    input === '0' ||
    input.includes('العودة للبوت') ||
    input.includes('عودة للبوت') ||
    input.includes('بوت') ||
    input.includes('القائمة الرئيسية') ||
    input.includes('إلغاء') ||
    input.includes('الغاء')
  ) {
    await showFullMainMenu(jid, lastMsg);
    return;
  }

  // إذا ضغط على "حجز موعد الآن" من داخل أي صفحة فرعية، يبدأ الحجز فوراً
  if (input === 'MENU_BOOKING' || input === 'CMD_START_BOOKING') {
    await startBookingFlow(jid, lastMsg, pushName || session?.pushName);
    return;
  }

  if (!session) {
    await sendWelcomeMenu(jid, lastMsg, pushName);
    return;
  }

  // إذا كان المريض داخل خطوات الحجز، نمرر إجابته لنظام الحجز الذكي
  if (session.mode === 'BOOKING') {
    await processBookingStep(jid, session, input, lastMsg);
    return;
  }

  // فحص الذكاء الاصطناعي للكلام الحر إذا كتب جملة خارج الحجز
  const detectedIntent = detectSmartIntent(input);
  const activeCommand = detectedIntent || input;

  // إذا اختار المريض التحدث المباشر مع الدكتور أو الاستقبال
  if (input === 'CMD_HUMAN_CHAT' || input.includes('التحدث مباشرة') || input.includes('كلم الدكتور') || input.includes('بشري')) {
    session.mode = 'HUMAN_CHAT';
    await sendSmartInteractive(
      jid,
      `👨‍⚕️ *تم تحويلك للمحادثة المباشرة مع د. أحمد سلامة وطاقم عيادة سلامتك*\n\nاتفضل اكتب استفسارك أو رسالتك هنا في الشات بالتفصيل، وهيتم الرد عليك مباشرة.\n\n💡 *(لو حبيت ترجع للبوت الذكي في أي وقت، اضغط الزر بالأسفل أو اكتب كلمة "بوت")*.`,
      [{ id: 'CMD_SHOW_FULL_MENU', title: '🤖 العودة للبوت الذكي' }],
      'اختر',
      lastMsg,
      false // تتمسح أيضاً بعد دقيقة ليبقى الشات نظيفاً تماماً
    );

    // إلغاء أرشفة المحادثة وإرسال إشعار تنبيه للدكتور
    try {
      if (lastMsg) {
        await sock.chatModify({ archive: false, lastMessages: [lastMsg] }, jid);
      }
      const patientPhone = session.cleanPhone || jid.split('@')[0];
      const humanAlert = `🔔 *تنبيه: المريض (${session.pushName || 'مريض جديد'}) طلب التحدث معك مباشرة على الواتساب!*\n📱 رقم المريض: ${patientPhone}\n💬 اضغط للتحدث معه: https://wa.me/${patientPhone.startsWith('01') ? '2' + patientPhone : patientPhone}`;
      await sock.sendMessage(DOCTOR_JID, { text: humanAlert });
    } catch (e) {}
    return;
  }

  // إذا كانت المحادثة في وضع التحويل البشري (HUMAN_CHAT) والبوت صامت
  if (session.mode === 'HUMAN_CHAT') {
    // إذا كتب 0 أو بوت أو قائمة يرجع للبوت
    if (input === '0' || input === 'بوت' || input.includes('القائمة') || input.includes('رئيسية')) {
      await sendWelcomeMenu(jid, lastMsg, session.pushName);
      return;
    }
    // غير ذلك: يظل البوت صامتاً تماماً ليسمح للدكتور بالرد على المريض بحرية!
    return;
  }

  // ==================== معالجة القوائم والأقسام ====================
  if (activeCommand === 'CMD_SHOW_FULL_MENU' || input === 'CMD_SHOW_FULL_MENU') {
    await showFullMainMenu(jid, lastMsg);
    return;
  }

  if (activeCommand === 'MENU_BOOKING') {
    await startBookingFlow(jid, lastMsg, session.pushName);
    return;
  }

  if (activeCommand === 'MENU_EMERGENCY') {
    session.mode = 'EMERGENCY_MENU';
    await sendSmartInteractive(
      jid,
      `🚨 *قسم حالات الطوارئ والحوادث (إرشادات طبية عاجلة)*\n\nده قسم مخصص لحالات الطوارئ عشان تعرف تتصرف صح فوراً وبأسرع وقت.\n\nاضغط على الحالة اللي عندك دلوقتي من الزر بالأسفل 👇`,
      [
        { id: 'EMERG_SWELLING', title: '⚠️ ورم شديد أو صعوبة تنفس', desc: 'تورم منتشر بالوجه مع سخونة أو تورم أسفل الحلق' },
        { id: 'EMERG_TRAUMA', title: '🦷 حوادث وصدمات الأسنان', desc: 'وقوع أو كسر سنة لبنية أو دائمة نتيجة خبطة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية', desc: 'العودة للصفحة الرئيسية للعيادة' }
      ],
      '🚨 اختر حالة الطوارئ',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'EMERG_SWELLING') {
    const msg = `⚠️ *طوارئ التورم الشديد وصعوبة التنفس (انتبه جيداً!):*\n\n1️⃣ *ورم شديد منتشر في الوجه مع سخونة واحمرار:*\nلو عندك ورم شديد بينتشر في جميع أنحاء الوجه مع سخونة واحمرار في الجلد، *لازم تتوجه فوراً إلى قسم الطوارئ في أقرب مستشفى* لأخذ الرعاية الطبية العاجلة.\n\n2️⃣ *تورم أسفل الحلق وعدم القدرة على التنفس (Ludwig's Angina):*\nلو فيه تورم شديد في أسفل الفك والحلق ومسبب ضيق أو انسداد في مجرى الهواء والمريض مش قادر ياخد نفسه أو يبلع، *دي حالة طوارئ قصوى ولازم التوجه فوراً لأقرب مستشفى* لتأمين مجرى التنفس فوراً.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'EMERG_TRAUMA', title: '🦷 طوارئ حوادث الأسنان' },
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد بالعيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'EMERG_TRAUMA') {
    await sendSmartInteractive(
      jid,
      `🦷 *حالات التروما والصدمات (وقوع أو كسر سنة بسبب خبطة أو حادثة):*\n\nالتصرف الصح بيختلف تماماً حسب هل السنة دي *سنة لبنية (لطفل)* ولا *سنة دائمة*!\n\nاضغط على نوع السنة لمعرفة التصرف الصحيح فوراً 👇`,
      [
        { id: 'TRAUMA_MILK', title: '🧒 سنة لبنية (أطفال)' },
        { id: 'TRAUMA_PERM', title: '🦷 سنة دائمة (كبار/أطفال)' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر نوع السنة المصابة',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'TRAUMA_MILK') {
    const msg = `🧒 *إسعافات وقوع أو صدمات السنة اللبنية (عند الأطفال):*\n\n✅ *مترجعش السنة مكانها:* لو السنة اللي وقعت دي سنة لبنية، بنسبة كبيرة جداً السنة دي مبترجعش مكانها تاني عشان منأذيش الضرس الدائم اللي تحتها.\n✅ *مش لازم تحتفظ بيها:* المريض مش لازم يحتفظ بالسنة اللبنية اللي وقعت، يرميها عادي.\n✅ *أهم خطوة:* التوجه للعيادة في أقرب وقت عشان دكتور أحمد يفحص الطفل ويطمن على اللثة وباقي الأسنان.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'TRAUMA_PERM', title: '🦷 لو سنة دائمة؟' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'TRAUMA_PERM') {
    const msg = `🦷 *إسعافات وقوع أو كسر السنة الدائمة (مهم جداً — عامل الوقت حاسم!):*\n\nلو السنة اللي اتخلعت من الخبطة *سنة دائمة*، اتبع الخطوات دي بالحرف وبأسرع ما يمكن:\n\n1️⃣ *امسك السنة صح:* امسك السنة من *الجزء الأبيض بتاعها (الطربوش / التاج)*، ومتمسكهاش أبداً من الجزء الأصفر (الروت أو الجذر) عشان نحافظ على أنسجة الجذر حية.\n\n2️⃣ *لو تقدر ترجعها مكانها:* لو تقدر تحطها في مكانها مظبوطة كان بها، وتوجه للعيادة في أقرب وقت.\n\n3️⃣ *لو مش هتقدر تحطها مكانها (طريقة الحفظ الصحيحة):*\n- لو شخص كبير أو طفل كبير وواعي: ممكن *يحطها في خده (جوه بقه بين الخد واللثة)* لأن *اللعاب* من أفضل البيئات الحافظة للأسنان المخلوعة أو المكسورة.\n- لو مفيش إمكانية يحطها في خده: *حطها فوراً في كوباية لبن* وتوجه للعيادة في أسرع وقت ممكن!\n\n⏰ *تذكر:* أهم حاجة هي *عامل الوقت*؛ كل ما المريض يتوجه للعيادة بدري وفي أسرع فرصة، كل ما نسب نجاح إنقاذ وتثبيت الحالات دي بتكون أفضل بكتير!`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد طوارئ' },
        { id: 'MENU_LOCATION', title: '📍 عنوان وأرقام العيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'MENU_SERVICES') {
    session.mode = 'SERVICES_MENU';
    const srvItems = SERVICES_DATA.map(s => ({
      id: s.id,
      title: s.title
    }));
    await sendSmartInteractive(
      jid,
      `🦷 *قائمة خدمات عيادة سلامتك (12 خدمة متكاملة)*\n\nإحنا في عيادة سلامتك بنحب المريض يكون فاهم كل خطوة هياخدها في علاجه عشان يطمن على صحته وعلى فلوسه.\n\nاضغط على الزر بالأسفل لاختيار الخدمة ومعرفة كل ما تشمله بالتفصيل 👇`,
      srvItems,
      '🦷 اختر الخدمة لعرض تفاصيلها',
      lastMsg
    );
    return;
  }

  // إذا اختار خدمة من قائمة الخدمات الـ 12
  const matchedSrv = SERVICES_DATA.find(s => s.id === activeCommand || input.includes(s.title));
  if (matchedSrv) {
    await sendSmartInteractive(
      jid,
      matchedSrv.details,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 باقي خدمات العيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'MENU_ROOT_CANAL') {
    const msg = `💳 *سؤال مهم: ليه حشو العصب بياخد خطوات كتير؟ وإزاي بنسهل عليك دفعه؟*\n\nناس كتير بتفتكر إن حشو العصب مجرد حشوة عادية وتستغلى تمنه، لكن الحقيقة إن *حشو العصب هو عملية إنقاذ كاملة للضرس بدل خلعه*، وفي عيادة سلامتك بيكون *شامل 7 حاجات كاملة* بدون ما تدفع جنيه زيادة:\n\n1️⃣ *أشعة ديجيتال وسنسور* قبل وأثناء وبعد الحشو.\n2️⃣ *التخدير الموضعي الكامل* بدون ألم.\n3️⃣ *إزالة التسوس بالكامل* وتنظيف الضرس.\n4️⃣ *سحب العصب وتطهير الجذور* بأحدث أجهزة الروتاري.\n5️⃣ *حشو القنوات العصبية* بالكامل.\n6️⃣ *تركيب الدعامة (الوتد)* جوه الضرس لتقويته وحمايته من الكسر.\n7️⃣ *الحشو الدائم النهائي* فوق الضرس + شرح طريقة الحفاظ عليه.\n\n🌟 *طب لو مش معايا التكلفة كاملة دلوقتي؟ اطمن خالص!*\n✅ *تقسيم الدفع على الجلسات:* الشغل بيتعمل على جلسات، وتقدر تدفع جزء في كل جلسة على قد ظروفك بدون أي ضغط.\n✅ *مفيش كشف تاني:* بتدفع الكشف في أول زيارة بس، وفي باقي الجلسات بتدفع حساب الشغل فقط!\n✅ *طرق دفع مرنة:* متاح الدفع *كاش* في العيادة أو عن طريق *فودافون كاش (Vodafone Cash)* أو *إنستا باي (InstaPay)*.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'MENU_WHY_US') {
    const msg = `✨ *ليه المرضى في عزبة السوق وبنها بيطمنوا في عيادة سلامتك؟*\n\n1️⃣ *أشعة ديجيتال وسنسور فوري (Portable X-Ray):*\nبنصور الضرس وأنت قاعد على الكرسي في ثانية من غير ما تقوم أو تتحرك، وتشوف صورة ضرسك بنفسك على الشاشة.\n\n2️⃣ *جلسة خطة علاج وتشخيص قبل ما نبدأ:*\nدكتور أحمد سلامة بيقعد معاك يشرح لك حالة أسنانك بالكامل، وإيه خطة العلاج المناسبة ليك قبل ما نلمس أي ضرس.\n\n3️⃣ *جلسة تعليم غسيل الأسنان والعناية بعد العلاج:*\nبعد ما نخلص علاجك، الدكتور بيعلمك عملياً إزاي تحافظ على الشغل اللي اتعمل وإزاي تغسل أسنانك صح عشان متحتاجش لدكتور تاني.\n\n4️⃣ *الكشف مرة واحدة فقط:*\nبتدفع الكشف أول زيارة بس، وبعدها كل جلسات العلاج والاستشارات والمتابعات مجانية بدون كشف جديد.\n\n5️⃣ *أعلى درجات التعقيم وبدون ألم:*\nأدواتك بتخرج من كيس التعقيم قدام عينك، وبنستخدم جل مخدر قبل شكة البنج وخامات أصلية حديثة.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'MENU_PLEDGE') {
    const msg = `🤝 *كلمة شرف وعهد من د. أحمد سلامة أبوالفتوح لكل مريض:*\n\n🦷 *1. الحفاظ على الضرس الطبيعي (مفيش استعجال ولا استسهال للخلع):*\nمستحيل نخلع ضرس طالما فيه أمل ولو بسيط إنه يتعالج ويعيش معاك، لأن مفيش زي خلقة ربنا.\n\n💰 *2. خدمة طبية محترمة تناسب الفلوس اللي بتدفعها:*\nإحنا بنقدم لك خدمة طبية محترمة وأمينة تستاهل الفلوس اللي بتدفعها؛ بنشتغل بخامات أصلية وأجهزة حديثة عشان الشغل يعيش معاك وميتعادش، وبنقولك بصراحة إيه الضروري دلوقتي وإيه اللي ممكن يتأجل.\n\n💳 *3. تيسير في الدفع وتقسيط على الجلسات:*\nلو الشغل محتاج جلسات (زي حشو العصب أو التركيبات) ومش معاك التكلفة كاملة، بتدفع جزء مريح في كل جلسة (كاش أو فودافون كاش أو إنستا باي).\n\n💉 *4. راحتك النفسية فوق كل شيء:*\nمبنشتغلش غير لما البنج يشتغل 100% وتكون مطمن ومستريح تماماً.`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_WHY_US', title: '✨ مميزات العيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'MENU_AFTERCARE') {
    await sendSmartInteractive(
      jid,
      `🪥 *تعليمات د. أحمد سلامة للعناية بأسنانك بعد العلاج*\n\nاختر التعليمات المطلوبة من الزر بالأسفل 👇`,
      [
        { id: 'CARE_EXT', title: '🩹 تعليمات ما بعد الخلع والجراحة', desc: 'إرشادات وقف النزيف والأكل والمضمضة' },
        { id: 'CARE_RC', title: '🦷 تعليمات ما بعد حشو العصب والحشو', desc: 'إرشادات الأكل والمسكنات وحماية الضرس' },
        { id: 'CARE_CROWN', title: '👑 تعليمات الطرابيش والأطقم المتحركة', desc: 'طريقة العناية بالتركيبات الثابتة والمتحركة' },
        { id: 'CARE_BRUSH', title: '🪥 الطريقة الصحيحة لغسيل الأسنان', desc: 'نصائح د. أحمد لتفريش الأسنان اليومي' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية', desc: 'العودة للصفحة الرئيسية' }
      ],
      '🪥 اختر التعليمات المطلوبة',
      lastMsg
    );
    return;
  }

  if (activeCommand.startsWith('CARE_')) {
    let text = '';
    if (activeCommand === 'CARE_EXT') {
      text = `🩹 *تعليمات مهمة جداً بعد خلع الضرس:*\n\n1️⃣ *العض على القطنة:* اضغط بأسنانك على القطنة الطبية لمدة ساعة كاملة متواصلة بدون كلام أو تغييرها.\n2️⃣ *ممنوع المضمضة أو البصق:* لمدة 24 ساعة عشان الجلطة الدموية اللي بتقفل الجرح متتحركش.\n3️⃣ *الأكل والشرب:* كل واشرب حاجات باردة وطرية (زبادي، عصير بارد، آيس كريم) في أول يوم، وابعد تماماً عن الأكل السخن والمشروبات السخنة والتدخين لمدة 24 ساعة.\n4️⃣ *بعد 24 ساعة:* ابدأ مضمضة بماء دافئ وملح خفيف أو الغسول الطبي اللي وصفه دكتور أحمد بعد كل أكل.`;
    } else if (activeCommand === 'CARE_RC') {
      text = `🦷 *تعليمات بعد حشو العصب أو الحشو التجميلي:*\n\n1️⃣ *ممنوع الأكل قبل زوال البنج:* استنى لحد ما البنج يفك تماماً (حوالي ساعتين) عشان متعضش شفايفك أو لسانك من غير ما تحس.\n2️⃣ *بين جلسات حشو العصب:* لو لسه بنحط حشو مؤقت بين الجلسات، تجنب المضغ القوي أو الأكل الناشف والملزق على الجنب ده لحد ما نركب الدعامة والحشو الدائم.\n3️⃣ *ألم خفيف طبيعي:* وارد تحس بنبض خفيف أو وجع بسيط عند اللمس أول يومين بعد تنظيف العصب، وده طبيعي جداً وبيروح بالمسكن اللي وصفه الدكتور.\n4️⃣ *حماية الضرس بالطربوش:* بعد انتهاء حشو العصب والدعامة، تركيب الطربوش بيحمي الضرس من الكسر ويعيش معاك سنين طويلة.`;
    } else if (activeCommand === 'CARE_CROWN') {
      text = `👑 *تعليمات الحفاظ على التركيبات الثابتة والمتحركة:*\n\n✅ *للتركيبات الثابتة (الزيركون والبورسلين):*\n- بعد لزق الطربوش النهائي، امتنع عن الأكل لمدة ساعة كاملة وتجنب الأكل الناشف أو الملزق أول 24 ساعة.\n- اغسل الطربوش بالفرشاة والمعجون زي أسنانك الطبيعية بالظبط ونظف بين الأسنان بالخيط الطبي.\n\n✅ *للأطقم والتركيبات المتحركة (الأكريل والفليكس):*\n- اشطف الطقم بالمية بعد كل وجبة، واغسله بفرشاة ناعمة وصابون سائل خفيف (بدون معجون أسنان خشن عشان ميتجرحش).\n- اخلع الطقم وقت النوم وحطه في كوباية مية نظيفة عشان اللثة ترتاح وتتنفس.`;
    } else {
      text = `🪥 *الطريقة الصحيحة لغسيل الأسنان (نصيحة د. أحمد سلامة):*\n\n1️⃣ *التوقيت الأهم:* مرتين يومياً — مرة الصبح، وأهم مرة *قبل النوم مباشرة* (ومتاكلش أي حاجة بعدها غير المية).\n2️⃣ *حركة الفرشاة الصح:* حرك الفرشاة بزاوية مائلة من اللثة للسن (من فوق لتحت في الفك العلوي، ومن تحت لفوق في الفك السفلي) وبحركة دائرية لطيفة، وممنوع غسيل أو تفريش الأسنان بالعرض بقوة عشان اللثة متنزفش.\n3️⃣ *لا تنسَ الأسطح الداخلية واللسان:* نظف الضروس من جوه ومن فوق، وامسح سطح اللسان بالفرشاة عشان تقضي على أي رائحة كريهة.\n4️⃣ *نوع الفرشاة:* استخدم فرشاة ناعمة (Soft) أو متوسطة (Medium) وغير الفرشاة كل 3 شهور.`;
    }
    await sendSmartInteractive(
      jid,
      text,
      [
        { id: 'MENU_AFTERCARE', title: '🔙 باقي التعليمات' },
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  if (activeCommand === 'MENU_LOCATION') {
    const msg = `📍 *عنوان ومواعيد عيادة سلامتك لطب الفم وتجميل الأسنان*\n\n👨‍⚕️ *الطبيب المعالج:*\n${CLINIC_INFO.doctor}\n(${CLINIC_INFO.title})\n\n🏢 *العنوان بالتفصيل:*\n${CLINIC_INFO.address}\n\n🗺️ *موقع العيادة على خرائط جوجل (Google Maps):*\n${CLINIC_INFO.mapsUrl}\n\n📘 *صفحتنا الرسمية على فيسبوك:*\n${CLINIC_INFO.fbUrl}\n\n🕒 *مواعيد العمل:*\n${CLINIC_INFO.hours}\n\n📞 *رقم الهاتف والواتساب:*\n*${CLINIC_INFO.phone}*`;
    await sendSmartInteractive(
      jid,
      msg,
      [
        { id: 'CMD_START_BOOKING', title: '📅 حجز موعد الآن' },
        { id: 'MENU_SERVICES', title: '🦷 خدمات العيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }
      ],
      'اختر',
      lastMsg
    );
    return;
  }

  // أي رسالة أخرى تعرض القائمة الرئيسية مع الترحيب باسم المريض
  await sendWelcomeMenu(jid, lastMsg, session.pushName);
}

// ==================== نظام الحجز التفاعلي الذكي ====================
async function startBookingFlow(jid, lastMsg = null, pushName = '') {
  let oldSession = userSessions.get(jid);
  if (oldSession) {
    await autoDeletePreviousMessages(jid, oldSession);
  }

  const cleanPhone = extractCleanPhoneNumber(lastMsg, jid) || oldSession?.cleanPhone || '';
  const displayName = pushName || oldSession?.pushName || '';

  const session = {
    mode: 'BOOKING',
    step: 1,
    waitingCustomInput: false,
    pushName: displayName,
    cleanPhone: cleanPhone,
    botMsgKeys: [],
    userMsgs: [],
    bookingData: {
      name: '',
      phone: cleanPhone,
      age: '',
      area: '',
      health: '',
      painLevel: '',
      prevVisitAndFear: '',
      serviceWanted: '',
      source: '',
      preferredTime: ''
    }
  };
  userSessions.set(jid, session);

  const greetingName = displayName ? `يا أستاذ/ة *${displayName}*` : 'بحضرتك';
  const needPhoneNote = !cleanPhone
    ? `\n*(ملاحظة: اكتب الاسم الثلاثي ومعاه رقم موبايلك للتواصل)*`
    : '';

  const intro =
    `📅 *أهلاً ${greetingName} في نظام الحجز الذكي لعيادة سلامتك*\n` +
    `(${CLINIC_INFO.doctor})\n\n` +
    `💡 *تذكير يطمنك:* الكشف بيتدفع أول مرة بس، وأي متابعة أو استشارة أو جلسات علاج بعد كده بدون أي رسوم كشف إضافية!\n\n` +
    `*السؤال 1 من 9:*\n` +
    `من فضلك اكتب *الاسم الثلاثي للمريض* في رسالة الآن:${needPhoneNote}`;

  const step1Buttons = [];
  if (displayName && displayName !== 'ضيفنا العزيز') {
    step1Buttons.push({ id: `USE_NAME_${displayName}`, title: `👤 الحجز باسم: ${displayName.substring(0, 14)}` });
  }
  step1Buttons.push({ id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' });

  await sendSmartInteractive(jid, intro, step1Buttons, 'اختر', lastMsg);
}

async function processBookingStep(jid, session, input, lastMsg) {
  // إذا ضغط المريض على "✍️ أخرى (اكتب بنفسك)" نطلب منه كتابة التفاصيل بيده
  if (input === 'CUSTOM_INPUT') {
    session.waitingCustomInput = true;
    await sendSmartInteractive(
      jid,
      `✍️ *اتفضل اكتب التفاصيل اللي تحب توضحها بإيدك في رسالة دلوقتي، وهسجلها في ملفك للدكتور أحمد فوراً:*`,
      [{ id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }],
      'اختر',
      lastMsg
    );
    return;
  }

  session.waitingCustomInput = false;
  const step = session.step;

  // -------------------- الخطوة 1: الاسم (ورقم الهاتف إن لم يكن ظاهراً) --------------------
  if (step === 1) {
    let chosenName = input;
    if (input.startsWith('USE_NAME_')) {
      chosenName = input.replace('USE_NAME_', '');
    }
    session.bookingData.name = chosenName;

    // استخراج أي رقم موبايل مصري كتبه المريض داخل الرسالة
    const typedPhoneMatch = chosenName.match(/(01[0125]\d{8})/);
    if (typedPhoneMatch) {
      session.bookingData.phone = typedPhoneMatch[1];
    }

    // إذا كان واتساب يخفي رقم المريض (@lid) ولم يكتبه بعد، نطلبه منه في خطوة سريعة لضمان صحة الرقم 100%
    if (!session.bookingData.phone) {
      session.step = 1.5;
      await sendSmartInteractive(
        jid,
        `تشرفنا بحضرتك يا أستاذ/ة *${session.bookingData.name}* 🙏\n\n📱 من فضلك اكتب *رقم الموبايل للتواصل* (11 رقم يبدأ بـ 01) لتأكيد الحجز:`,
        [{ id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' }],
        'اختر',
        lastMsg
      );
      return;
    }

    session.step = 2;
    await askStep2Age(jid, session, lastMsg);
    return;
  }

  if (step === 1.5) {
    const digits = input.replace(/\D/g, '');
    session.bookingData.phone = digits || input;
    session.step = 2;
    await askStep2Age(jid, session, lastMsg);
    return;
  }

  // -------------------- الخطوة 2: العمر --------------------
  if (step === 2) {
    const ageMap = {
      'AGE_1': 'رضيع / طفل صغير (أقل من 5 سنوات)',
      'AGE_2': 'طفل (5 - 12 سنة)',
      'AGE_3': 'شاب / بالغ (13 - 40 سنة)',
      'AGE_4': 'فوق 40 سنة'
    };
    session.bookingData.age = ageMap[input] || input;
    session.step = 3;

    await sendSmartInteractive(
      jid,
      `تمام جداً 👍\n\n*السؤال 3 من 9:*\nحضرتك منورنا وجاي منين؟\n💡 *(اختر من القائمة بالأسفل، أو اكتب اسم منطقتك/قريتك في رسالة مباشرة)* 👇`,
      [
        { id: 'AREA_1', title: '📍 1. عزبة السوق', desc: 'عزبة السوق وأول شارع الشموت ومحيط العيادة' },
        { id: 'AREA_2', title: '📍 2. قرية مجاورة لعزبة السوق', desc: 'الشموت، كفر الشموت، كفر مويس، ميت عاصم، عزبة زكي، الفاروقية، نجيب، الرمالي، الميتيني' },
        { id: 'AREA_3', title: '📍 3. مدينة بنها ذات نفسها', desc: 'الأهرام، الفلل، المنشية، وسط البلد، الشدية، بنها الجديدة' },
        { id: 'AREA_4', title: '📍 4. قرية تابعة لمركز بنها', desc: 'شبلنجة، مرصفا، سندنهور، ورورة، نقباس، ميت العطار، دجوي، طحلة، بتمدة، بطا، كفر الجزار' },
        { id: 'AREA_5', title: '📍 5. من خارج بنها (داخل القليوبية)', desc: 'طوخ، كفر شكر، شبين القناطر، قليوب، قها، الخانكة، القناطر' },
        { id: 'AREA_6', title: '📍 6. من خارج محافظة القليوبية', desc: 'محافظة أخرى خارج القليوبية' },
        { id: 'CUSTOM_INPUT', title: '✍️ أخرى (اكتب اسم منطقتك بنفسك)', desc: 'اضغط هنا لكتابة عنوانك أو قريتك بالتفصيل' },
        { id: 'CMD_MAIN_MENU', title: '🏠 إلغاء والعودة للقائمة الرئيسية', desc: 'الرجوع للقائمة الرئيسية للعيادة' }
      ],
      '📍 اختر المنطقة',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 3: المنطقة --------------------
  if (step === 3) {
    const areaMap = {
      'AREA_1': 'عزبة السوق',
      'AREA_2': 'قرية مجاورة لعزبة السوق (الشموت / كفر مويس / ميت عاصم / عزبة زكي / الفاروقية وما حولها)',
      'AREA_3': 'مدينة بنها ذات نفسها (الأهرام / الفلل / المنشية / وسط البلد)',
      'AREA_4': 'قرية تابعة لمركز بنها',
      'AREA_5': 'من خارج بنها (داخل محافظة القليوبية)',
      'AREA_6': 'من خارج محافظة القليوبية (محافظة أخرى)'
    };
    session.bookingData.area = areaMap[input] || input;
    session.step = 4;

    await sendSmartInteractive(
      jid,
      `منورنا يا أهلنا الكرام 🌟\n\n*السؤال 4 من 9 (مهم لسلامتك ولاختيار البنج المناسب):*\nهل يعاني المريض من أي *أمراض مزمنة أو حالة صحية خاصة*؟\n💡 *(اختر من الزر تحت أو اكتب حالتك الصحية والأدوية اللي بتاخدها بإيدك في رسالة)* 👇`,
      [
        { id: 'HLTH_1', title: '💚 الحمد لله سليم تماماً', desc: 'لا توجد أي أمراض مزمنة أو حساسية' },
        { id: 'HLTH_2', title: '🩺 ضغط أو سكر', desc: 'لتجهيز البنج الآمن المخصص لمرضى الضغط والسكر' },
        { id: 'HLTH_3', title: '💊 أدوية سيولة في الدم', desc: 'لأخذ الاحتياطات الطبية اللازمة قبل أي إجراء' },
        { id: 'HLTH_4', title: '🤰 حامل أو مرضعة', desc: 'لتخصيص البنج والعلاج الآمن تماماً للحمل والرضاعة' },
        { id: 'HLTH_5', title: '⚠️ حساسية من أدوية معينة', desc: 'يرجى توضيحها للدكتور قبل البدء' },
        { id: 'CUSTOM_INPUT', title: '✍️ أخرى (اكتب حالتك الصحية بنفسك)', desc: 'اضغط هنا لكتابة أي تفاصيل صحية أو أدوية' },
        { id: 'CMD_MAIN_MENU', title: '🏠 إلغاء والعودة للقائمة الرئيسية', desc: 'الرجوع للقائمة الرئيسية' }
      ],
      '🩺 اختر الحالة الصحية',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 4: الحالة الصحية --------------------
  if (step === 4) {
    const healthMap = {
      'HLTH_1': 'الحمد لله سليم ولا توجد أمراض مزمنة',
      'HLTH_2': 'ضغط أو سكر',
      'HLTH_3': 'باخد أدوية سيولة في الدم',
      'HLTH_4': 'حامل أو مرضعة',
      'HLTH_5': 'حساسية من أدوية معينة'
    };
    session.bookingData.health = healthMap[input] || input;
    session.step = 5;

    await sendSmartInteractive(
      jid,
      `ألف سلامة، سجلنا ده في ملفك عشان دكتور أحمد يختار لك البنج والخطة الآمنة 100% لحالتك 👌\n\n*السؤال 5 من 9:*\nإيه *طبيعة الشكوى أو الوجع* اللي حاسس بيه دلوقتي؟\n💡 *(اختر من الزر تحت، أو اكتب بإيدك وصف الوجع اللي حاسس بيه بالظبط في رسالة)* 👇`,
      [
        { id: 'PAIN_1', title: '🚨 وجع شديد يصحيني من النوم', desc: 'ألم مستمر وقوي (مع تناول مسكنات)' },
        { id: 'PAIN_2', title: '❄️ وجع مع الساقع والحلويات', desc: 'ألم يظهر فقط مع المشروبات الباردة أو السكريات' },
        { id: 'PAIN_3', title: '🍽️ وجع مع المضغ أو ورم باللثة', desc: 'ألم عند الضغط على الضرس أو التهاب وتورم باللثة' },
        { id: 'PAIN_4', title: '😊 مفيش وجع (كشف/تنظيف/تركيبة)', desc: 'فحص شامل أو تنظيف جير أو تركيبة أو تجميل' },
        { id: 'CUSTOM_INPUT', title: '✍️ أخرى (اكتب شكوتك بالتفصيل بنفسك)', desc: 'اوصف اللي حاسس بيه بالظبط في رسالة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 إلغاء والعودة للقائمة الرئيسية', desc: 'الرجوع للقائمة الرئيسية' }
      ],
      '🦷 اختر طبيعة الشكوى',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 5: الشكوى والألم --------------------
  if (step === 5) {
    const painMap = {
      'PAIN_1': 'وجع شديد ومستمر بيصحيني من النوم',
      'PAIN_2': 'وجع مع المية الساقعة والحلويات فقط',
      'PAIN_3': 'وجع مع المضغ أو التهاب باللثة',
      'PAIN_4': 'بدون ألم حالي (كشف / تنظيف / تركيبة / تجميل)'
    };
    session.bookingData.painLevel = painMap[input] || input;
    session.step = 6;

    await sendSmartInteractive(
      jid,
      `فهمتك تماماً، ودكتور أحمد هيفحص السبب بالأشعة الديجيتال وأنت على الكرسي 📸\n\n*السؤال 6 من 9 (سؤال يهم دكتور أحمد شخصياً):*\nهل رحت لدكتور أسنان قبل كده؟ وإيه *أكتر حاجة مقلقاك أو شاغلة بالك* في الزيارة دي؟\n💡 *(اختر من الزر تحت أو اكتب اللي شاغل بالك في رسالة)* 👇`,
      [
        { id: 'FEAR_1', title: '💉 خايف من الوجع أو شكة البنج', desc: 'قلق من ألم الحقنة أو الشغل' },
        { id: 'FEAR_2', title: '💰 معرفة التكلفة والخطة قبل البدء', desc: 'عايز أعرف خطة العلاج والتكلفة وتقسيط الجلسات' },
        { id: 'FEAR_3', title: '🦷 خايف أخلع ضرس ينفع يتعالج', desc: 'عايز أحافظ على ضرسى الطبيعي من الخلع' },
        { id: 'FEAR_4', title: '😟 عندي تجربة قديمة سيئة', desc: 'مررت بتجربة سابقة غير مريحة عند طبيب أسنان' },
        { id: 'FEAR_5', title: '😊 أول مرة أو مطمن الحمد لله', desc: 'جاهز ومطمن للزيارة بإذن الله' },
        { id: 'CUSTOM_INPUT', title: '✍️ أخرى (اكتب اللي مقلقك بنفسك)', desc: 'اكتب أي ملاحظة تحب دكتور أحمد يراعيها معاك' },
        { id: 'CMD_MAIN_MENU', title: '🏠 إلغاء والعودة للقائمة الرئيسية', desc: 'الرجوع للقائمة الرئيسية' }
      ],
      '💭 اختر أكتر حاجة شاغلة بالك',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 6: المخاوف + عرض قائمة الخدمات الـ 12 --------------------
  if (step === 6) {
    const fearMap = {
      'FEAR_1': 'خايف من الوجع أو شكة البنج',
      'FEAR_2': 'عايز أعرف التكلفة والخطة كلها قبل ما نبدأ',
      'FEAR_3': 'خايف أخلع ضرس يكون لسه ينفع يتعالج',
      'FEAR_4': 'عندي تجربة قديمة سيئة وخايف تتكرر',
      'FEAR_5': 'أول مرة أو مطمن الحمد لله'
    };
    const chosenFear = fearMap[input] || input;
    session.bookingData.prevVisitAndFear = chosenFear;
    session.step = 7;

    let reassure = `🌟 *رسالة تطمين خاصة ليك من د. أحمد سلامة:*\n`;
    if (chosenFear.includes('الوجع')) {
      reassure += `اطمن خالص! إحنا بنحط "جل مخدر" بطعم لطيف على اللثة قبل البنج عشان متحسش بالشكة أصلاً، ومستحيل دكتور أحمد يبدأ شغل غير لما تتأكد بنفسك إن الضرس متخدر 100%.`;
    } else if (chosenFear.includes('التكلفة')) {
      reassure += `حقك تماماً! في عيادة سلامتك بنعمل لك جلسة خطة علاج بعد الكشف نشرح لك فيها التكلفة والخطوات قبل ما نلمس أي ضرس، والكشف بتدفعه أول مرة بس، ولو العلاج جلسات تقدر تقسم التكلفة وتدفع جزء في كل جلسة (كاش أو فودافون كاش أو إنستا باي)!`;
    } else if (chosenFear.includes('أخلع')) {
      reassure += `اطمن، عندنا مفيش أي استعجال أو استسهال في الخلع! طالما الضرس فيه أمل بنسبة 1% يتعالج ويعيش معاك، بنعالجه بالأشعة الديجيتال والدعامة ونحافظ عليه.`;
    } else if (chosenFear.includes('تجربة')) {
      reassure += `حقك تقلق، بس بنوعدك إن زيارتك لعيادة سلامتك هتغير فكرتك تماماً عن دكاترة الأسنان؛ هدوء، تعقيم قدام عينك، وشرح لكل خطوة قبل ما نعملها.`;
    } else {
      reassure += `دايماً مطمن وبصحة وعافية يا رب! هنكون عند حسن ظنك من أول دقيقة.`;
    }

    const serviceChoiceRows = SERVICES_DATA.map(s => ({
      id: s.id,
      title: s.title
    }));

    await sendSmartInteractive(
      jid,
      `${reassure}\n\n*السؤال 7 من 9:*\nإيه *الخدمة المطلوبة أو المرغوبة* من خدمات العيادة؟\n💡 *(بمجرد اختيار الخدمة هعرض لك كل خطواتها وتفاصيلها كاملة عشان تطمن، أو اكتب طلبك في رسالة)* 👇`,
      serviceChoiceRows,
      '🦷 اختر الخدمة المطلوبة',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 7: الخدمة المطلوبة + عرض تفاصيل الخدمة كاملة للمريض! --------------------
  if (step === 7) {
    const foundSrv = SERVICES_DATA.find(s => s.id === input || input.includes(s.title));
    session.bookingData.serviceWanted = foundSrv ? foundSrv.title : input;
    session.step = 8;

    const serviceDetailsBlock = foundSrv
      ? `✅ *تم اختيار: ${foundSrv.title}*\n━━━━━━━━━━━━━━━\n📖 *تفاصيل الخدمة اللي هتاخدها في عيادة سلامتك:*\n${foundSrv.details}\n━━━━━━━━━━━━━━━\n\n`
      : `✅ *تم تسجيل الخدمة المطلوبة: ${session.bookingData.serviceWanted}*\n\n`;

    await sendSmartInteractive(
      jid,
      `${serviceDetailsBlock}*السؤال 8 من 9:*\nحضرتك *عرفت عيادة سلامتك عن طريق إيه*؟ 👇`,
      [
        { id: 'SRC_1', title: '📱 عن طريق السوشيال ميديا', desc: 'صفحة الفيسبوك أو الإعلانات' },
        { id: 'SRC_2', title: '🤝 ترشيح أو توصية من قريب أو صاحب', desc: 'مريض جرب العيادة ورشحها لي' },
        { id: 'SRC_3', title: '🏘️ من أهل المنطقة', desc: 'من سكان عزبة السوق والشموت وبنها' },
        { id: 'SRC_4', title: '✨ عرفت العيادة قدراً أو بالصدفة', desc: 'شوفت يافطة العيادة أو بالصدفة' },
        { id: 'CUSTOM_INPUT', title: '✍️ أخرى (اكتب بنفسك)', desc: 'اضغط لكتابة طريقة معرفة العيادة' },
        { id: 'CMD_MAIN_MENU', title: '🏠 إلغاء والعودة للقائمة الرئيسية', desc: 'الرجوع للقائمة الرئيسية' }
      ],
      '📢 اختر طريقة معرفة العيادة',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 8: طريقة معرفة العيادة --------------------
  if (step === 8) {
    const sourceMap = {
      'SRC_1': 'عن طريق السوشيال ميديا',
      'SRC_2': 'عن طريق ترشيح أو توصية من قريب أو صاحب',
      'SRC_3': 'من أهل المنطقة',
      'SRC_4': 'عرفت العيادة قدراً أو بالصدفة'
    };
    session.bookingData.source = sourceMap[input] || input;
    session.step = 9;

    await sendSmartInteractive(
      jid,
      `ممتاز جداً 🌟\n\n*السؤال 9 والأخير:*\nإيه *اليوم والفترة المناسبة ليك* لتشريفنا في العيادة؟\n*(مواعيد العمل يومياً من 3 عصراً لـ 10 مساءً ما عدا الجمعة — أو اكتب اليوم والساعة المناسبة ليك في رسالة)* 👇`,
      [
        { id: 'TIME_1', title: '🕒 اليوم (من 3 إلى 6 عصراً)', desc: 'الحضور اليوم في الفترة الأولى' },
        { id: 'TIME_2', title: '🌙 اليوم (من 6 إلى 10 مساءً)', desc: 'الحضور اليوم في الفترة المسائية' },
        { id: 'TIME_3', title: '📅 غداً (من 3 إلى 6 عصراً)', desc: 'الحضور غداً في الفترة الأولى' },
        { id: 'TIME_4', title: '🌙 غداً (من 6 إلى 10 مساءً)', desc: 'الحضور غداً في الفترة المسائية' },
        { id: 'CUSTOM_INPUT', title: '✍️ تحديد يوم أو موعد آخر بنفسك', desc: 'اضغط هنا لكتابة اليوم والساعة اللي تناسبك' },
        { id: 'CMD_MAIN_MENU', title: '🏠 إلغاء والعودة للقائمة الرئيسية', desc: 'الرجوع للقائمة الرئيسية' }
      ],
      '🕒 اختر الموعد المناسب',
      lastMsg
    );
    return;
  }

  // -------------------- الخطوة 9: إتمام الحجز + مسح كل الرسائل التمهيدية + إرسال الملخص النهائي للمريض وللدكتور --------------------
  if (step === 9) {
    const timeMap = {
      'TIME_1': 'اليوم — الفترة الأولى (من 3 إلى 6 عصراً)',
      'TIME_2': 'اليوم — الفترة المسائية (من 6 إلى 10 مساءً)',
      'TIME_3': 'غداً — الفترة الأولى (من 3 إلى 6 عصراً)',
      'TIME_4': 'غداً — الفترة المسائية (من 6 إلى 10 مساءً)'
    };
    session.bookingData.preferredTime = timeMap[input] || input;
    session.mode = 'MAIN_MENU';
    session.step = 0;

    // إضافة الرسالة الأخيرة للمريض لقائمة التنظيف ثم مسح كل الرسائل التمهيدية السابقة!
    if (lastMsg && lastMsg.key) {
      session.userMsgs.push(lastMsg);
    }
    await autoDeletePreviousMessages(jid, session);

    const d = session.bookingData;
    const finalPhone = d.phone || session.cleanPhone || 'مسجل بالمحادثة';

    // 1. رسالة الحجز النهائية التي تبقى مسجلة بينك وبين المريض (لا تُمسح أبداً!)
    const summaryForPatient =
      `✅ *بطاقة تأكيد الحجز النهائي — ${CLINIC_INFO.name}*\n` +
      `👨‍⚕️ *${CLINIC_INFO.doctor}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 *اسم المريض:* ${d.name}\n` +
      `📱 *رقم الموبايل:* ${finalPhone}\n` +
      `🎂 *العمر:* ${d.age}\n` +
      `📍 *المنطقة:* ${d.area}\n` +
      `🩺 *الحالة الصحية:* ${d.health}\n` +
      `🚨 *طبيعة الشكوى والألم:* ${d.painLevel}\n` +
      `💭 *ملاحظات ومخاوف المريض:* ${d.prevVisitAndFear}\n` +
      `🦷 *الخدمة المطلوبة:* ${d.serviceWanted}\n` +
      `📢 *عرف العيادة عن طريق:* ${d.source}\n` +
      `🕒 *الموعد المفضل:* ${d.preferredTime}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `💳 *تذكير:* الكشف يُدفع أول مرة فقط، ومتاح الدفع كاش أو فودافون كاش أو إنستا باي.\n` +
      `🏢 *العنوان:* ${CLINIC_INFO.address}\n` +
      `🗺️ *اللوكيشن:* ${CLINIC_INFO.mapsUrl}\n` +
      `📞 *تليفون العيادة:* ${CLINIC_INFO.phone}`;

    // إرسال الرسالة النهائية للمريض مع keepForever = true حتى تظل محفوظة عند المريض وعندك في محادثته
    await sendSmartInteractive(
      jid,
      summaryForPatient,
      [
        { id: 'CMD_MAIN_MENU', title: '🏠 القائمة الرئيسية' },
        { id: 'MENU_LOCATION', title: '📍 العنوان واللوكيشن' }
      ],
      'اختر',
      null,
      true // keepForever = true (لا تُمسح!)
    );

    // إلغاء أرشفة محادثة المريض بعد اكتمال الحجز النهائي لتظهر بآخر رسالة فقط
    try {
      if (lastMsg) {
        await sock.chatModify({ archive: false, lastMessages: [lastMsg] }, jid);
      }
    } catch (e) {}

    // 2. إرسال بطاقة الحجز النهائية إلى رقم الدكتور الأساسي (My Number) لتظل مسجلة عندك أيضاً
    const waLinkPhone = finalPhone.startsWith('01') ? `2${finalPhone}` : finalPhone.replace(/\D/g, '');
    const doctorSummary =
      `🔔 *رسالة حجز نهائي جديدة — عيادة سلامتك*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 *اسم المريض:* ${d.name}\n` +
      `📱 *رقم موبايل المريض:* ${finalPhone}\n` +
      `🎂 *العمر:* ${d.age}\n` +
      `📍 *المنطقة:* ${d.area}\n` +
      `🩺 *الحالة الصحية:* ${d.health}\n` +
      `🚨 *طبيعة الشكوى والألم:* ${d.painLevel}\n` +
      `💭 *ما يشغل بال المريض:* ${d.prevVisitAndFear}\n` +
      `🦷 *الخدمة المطلوبة:* ${d.serviceWanted}\n` +
      `📢 *عرف العيادة عن طريق:* ${d.source}\n` +
      `🕒 *الموعد المطلوب:* ${d.preferredTime}\n` +
      `━━━━━━━━━━━━━━━\n` +
      (waLinkPhone ? `💬 *للتواصل المباشر مع المريض:* https://wa.me/${waLinkPhone}` : '');

    try {
      await sock.sendMessage(DOCTOR_JID, { text: doctorSummary });
    } catch (err) {
      console.error('Error sending summary to doctor number:', err.message);
    }
  }
}

async function askStep2Age(jid, session, lastMsg) {
  await sendSmartInteractive(
    jid,
    `تشرفنا بحضرتك يا أستاذ/ة *${session.bookingData.name}* 🙏\n\n*السؤال 2 من 9:*\nكم *عمر المريض*؟\n💡 *(اضغط على الزر بالأسفل للاختيار، أو اكتب السن مباشرة في رسالة)* 👇`,
    [
      { id: 'AGE_1', title: '🍼 رضيع / طفل (أقل من 5 سنوات)', desc: 'قسم طب أسنان الرضع وحديثي الولادة' },
      { id: 'AGE_2', title: '🧒 طفل (من 5 إلى 12 سنة)', desc: 'قسم طب أسنان الأطفال المتكامل' },
      { id: 'AGE_3', title: '🧑 شاب / بالغ (من 13 إلى 40 سنة)', desc: 'علاجات وتجميل وجراحة الأسنان للبالغين' },
      { id: 'AGE_4', title: '👨‍🦳 فوق 40 سنة', desc: 'عناية متكاملة وتركيبات وزراعة الأسنان' },
      { id: 'CUSTOM_INPUT', title: '✍️ كتابة العمر بالسنوات بنفسك', desc: 'اضغط هنا لكتابة عمر المريض بالظبط' },
      { id: 'CMD_MAIN_MENU', title: '🏠 إلغاء والعودة للقائمة الرئيسية', desc: 'الرجوع للقائمة الرئيسية' }
    ],
    '🎂 اختر عمر المريض',
    lastMsg
  );
}

// ==================== تشغيل اتصال واتساب ====================
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
      connectionStatus = '✅ البوت الذكي V3 متصل الآن ويعمل بنجاح 24/7!';
      console.log('\n==================================================');
      console.log('✅ البوت الذكي V3 متصل الآن ويعمل بنجاح 24/7!');
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
        '';

      // التقاط الـ ID الدقيق والنص الظاهر للزر أو السطر الذي ضغط عليه المريض (يدعم كل إصدارات واتساب)
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
      <title>بوت عيادة سلامتك الذكي V3</title>
      <style>
        body { font-family: Tahoma, Arial, sans-serif; background: #f0fdf4; color: #064e3b; text-align: center; padding: 25px; }
        .card { max-width: 440px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 25px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border: 2px solid #10b981; }
        .status { padding: 14px; border-radius: 12px; background: #ecfdf5; font-weight: bold; margin: 15px 0; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🦷 بوت عيادة سلامتك الذكي (V3)</h2>
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
