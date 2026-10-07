Here's the complete, exhaustive, word-by-word transcript, followed by the detailed list of requirements, architectural decisions, and specific instructions.

---

**1. Complete Verbatim Transcript:**

[00:00:00] [Sir] तो जब अदर्स करेगा तो ऑटोमेटिक उसका एक टाइटल आ जाएगा कि ये डॉक्यूमेंट क्या है। वो देगा ना फिर अपलोड करेगा।
[00:00:05] [Sir] इन सबका भी टाइटल होगा पर उसमें यही पेस्ट हो जाएगा वापस।
[00:00:10] [Sir] समझ में आ गई बात?
[00:00:11] [Guri] हां जी।
[00:00:12] [Sir] क्लियर?
[00:00:14] [Sir] एम्प्लॉई का। यहां पे डेट ऑफ जॉइनिंग आएगा, डेट ऑफ
[00:00:18] [Sir] रिजाइनिंग आएगा यहां पे। लास्ट डे आएगा। एंड।
[00:00:23] [Guri] ठीक है।
[00:00:24] [Sir] ठीक है जी? अब एक चीज याद रखना।
[00:00:28] [Sir] यूजर में भी मैं बताना भूल गया तेरे को।
[00:00:32] [Sir] यूजर डिटेल के अंदर।
[00:00:36] [Sir] कई बार हम यूजर का जैसे टाइप चेंज कर रहे हैं तो उसका पुराना रिकॉर्ड नहीं मिस होगा।
[00:00:41] [Guri] अच्छा।
[00:00:41] [Sir] मैं किसी यूजर का डिटेल खोलूं तो वहां पे एक आ जाएगा लॉग्स। ये भी होना चाहिए। एक आ जाएगा जो
[00:00:50] [Sir] क्या कहते हैं जो उसकी
[00:00:54] [Sir] सॉफ्टवेयर जर्नी है। क्या है?
[00:00:55] [Guri] सॉफ्टवेयर जर्नी।
[00:00:57] [Background noise - phone ringing]
[01:01:01] [Sir] हेलो।
[01:02:47] [Guri] सत श्री अकाल सर।
[01:03:47] [Sir] सत श्री अकाल।
[01:04:47] [Sir] समझ गया?
[01:06:47] [Sir] समझ गया?
[01:07:47] [Sir] तो लॉग्स बनने चाहिए उसके सॉफ्टवेयर जर्नी। क्या?
[01:11:47] [Guri] सॉफ्टवेयर जर्नी।
[01:12:47] [Sir] तो इसको क्लिक करूं ना बटन को मैं।
[01:14:47] [Guri] हम्म।
[01:15:47] [Sir] समझ गया ना? यहां लॉग्स। उसने क्या-क्या किया है? उसने क्या-क्या किया है? इसकी जर्नी उसने जैसे मान लो इस यूजर को देखा, इस प्रोफाइल को देखा, इस पैनल में गया। हमें हर लॉग्स मैनेज करने हैं एनालिटिक्स के लिए। किसके लिए?
[01:27:47] [Guri] एनालिटिक्स के लिए।
[01:28:47] [Sir] कौन सा मॉड्यूल ज्यादा यूज हो रहा है, कौन से पेज पे जा रहे हैं, है ना? ये बाद में इसको कम करते जाएंगे।
[01:33:47] [Guri] अच्छा।
[01:34:47] [Sir] इवन वो किसी पेज पे गया है वो भी लॉग ब्लॉक करेगा।
[01:37:47] [Guri] ओके।
[01:38:47] [Sir] तभी मैंने लॉग का डीबी अलग बनाया। वो भरेगा।
[01:40:47] [Guri] हां, वो भरेगा।
[01:41:47] [Sir] हां, वो भरेगा। हमें एनालिटिक्स निकालना है। उसके बाद हम उसको फिल्टर लगाते जाएंगे जो मेन पेज होंगे। क्योंकि हमें ऐसे पेजों पे लॉग जरूर रखना है। कल को ये ना बोले यार मैं तो कुछ किया ही नहीं।
[01:51:47] [Guri] हम्म।
[01:51:47] [Sir] उसके आगे हम उसे एक्शन पे कर देंगे। किस पे?
[01:53:47] [Guri] एक्शन पे कर देंगे।
[01:55:47] [Sir] पर तू एक्शन भी कर गया। ठीक है। किस पे?
[01:57:47] [Guri] एक्शन पे।
[01:58:47] [Sir] इस यूजर ने मान लो जा के यार आउटसेट किया था, इस बच्चे का अपडेट किया था, ये किया तो वो लॉग्स बनाएगा।
[02:04:47] [Guri] ठीक है, ठीक है, ठीक है।
[02:05:47] [Sir] ठीक है? ये लॉग्स है। सॉफ्टवेयर जर्नी क्या है कि जब उसको ऐड किया था तो वो क्या था? ऐड इस दिन किया।
[02:11:47] [Guri] हां।
[02:11:47] [Sir] वो यूजर था। फिर इस दिन वो एडमिन बना दिया गया। किसने बनाया वो डिटेल आ गई। ये किसने ऐड किया वो डिटेल आ गई टाइम के साथ ही। इस तरह से उसकी पूरी जर्नी है यहां पे। कल को हमें पता लग जाए डेट वाइज।
[02:23:47] [Guri] ओके, वेरी स्मार्ट। ओके।
[02:25:47] [Sir] ठीक है?
[02:27:47] [Sir] एक सीबीआई वाले कैसे ढूंढ लेते हैं कि इसने क्या किया, क्या नहीं किया।
[02:32:47] [Sir] तूने रिकॉर्डिंग चला रखी है क्या?
[02:34:47] [Guri] हां। हां जी, हां जी, हां जी।
[02:35:47] [Sir] ठीक है? वो वो वो बाद में मैं भूल जाऊंगा। डेट ऑफ टाइम और डेट ऑफ जॉइनिंग और डेट ऑफ एंड समझ में आ गया? सेम वे में इसका। कल को किसी एम्प्लॉईज को छोड़ के जाता है, हटा दिया जाता है। कल को रीजॉइन भी तो कर सकता है ना वो?
[02:47:47] [Guri] हम्म।
[02:48:47] [Sir] जब वो रीजॉइन करेगा। ठीक है? समझ में आई चीज?
[02:52:47] [Guri] हां जी।
[02:53:47] [Sir] तो वो स्टेटस तूने यहां मैनेज करना है कि वो कैंडिडेट रीजॉइन वाला है, फ्रेशर है।
[02:59:47] [Guri] हम्म।
[03:01:47] [Sir] तो कल को जब मैं इसकी सॉफ्टवेयर जर्नी खोलूं, इसके भी लॉग्स बनेंगे ना इसने क्या किया है? और इसकी सॉफ्टवेयर जर्नी होगी। खोलूं तो अच्छा यार इतने से इतने टाइम ये एज ए टीचर था, फिर बाद में ये प्रोफेसर बना दिया। डेजिग्नेशन भी चेंज होती है। तो डेजिग्नेशन चेंज करते हुए हमें पूछना है ये कि प्रमोशन है, डिमोशन है या एडिशनल रोल है या?
[03:19:47] [Guri] एडिशनल रोल है।
[03:20:47] [Sir] या रोल स्विच है या रोल?
[03:22:47] [Guri] स्विच है।
[03:22:47] [Sir] ये चार केस बनते हैं।
[03:26:47] [Sir] एडिशनल रोल प्रमोशन की तरह ही होता है। तो कल को यहां पे आ जाएगा यार उसको एडिशनल रोल दिया गया। नहीं यार उसको डेजिग्नेशन चेंज कर दी गई, रोल चेंज कर दिया गया। तो ये सॉफ्टवेयर जर्नी है पूरी। क्या है?
[03:37:47] [Guri] सॉफ्टवेयर जर्नी।
[03:38:47] [Sir] पूरी उसकी जर्नी है ना इस इस स्कूल जर्नी या जो भी है। ऑर्गेनाइजेशन जर्नी। क्या?
[03:44:47] [Sir] वो लिख दे ऑर्गेनाइजेशन जर्नी।
[03:46:47] [Guri] ऑर्गेनाइजेशन जर्नी।
[03:47:47] [Sir] ठीक है? तो हमें कल को पता लग जाएगा अच्छा वो यहां पे छोड़ के चला गया। अच्छा वो दोबारा जॉइन कर गया।
[03:54:47] [Sir] क्लियर है?
[03:56:47] [Sir] एक अलग से जैसे मैंने बताया ना ये जो है ना देखो इसकी जो टेबल स्ट्रक्चर बनेगा। याद रखना एक बेसिक इंफॉर्मेशन का बनेगा, एक एडिशनल इंफॉर्मेशन का बनेगा, एक एड्रेस की अलग ही टेबल बनेगी क्योंकि वो मल्टी एड्रेस हो सकते हैं। सेम बैंक डिटेल्स मल्टी हो सकते हैं। सेम क्वालिफिकेशंस, सेम सर्टिफिकेशंस, सेम एक्सपीरियंस। सबकी मल्टी रिकॉर्ड हो सकते हैं। तो हर डाटा पे ये देखना है कि कौन सा मल्टी रिकॉर्ड हो सकता है। वो बनेगा और उसमें डिफॉल्ट सेट होगा हमेशा। क्या?
[04:25:47] [Sir] एम्प्लॉई वाइज। क्या होगा?
[04:27:47] [Guri] डिफॉल्ट सेट होगा।
[04:28:47] [Sir] डिफॉल्ट सेट होगा। जैसे क्वालिफिकेशन में हाईएस्ट क्वालिफिकेशन डिफॉल्ट होगी जो हमेशा दिखाई देगी। एक्सपीरियंस में जो लास्ट एक्सपीरियंस है वो डिफॉल्ट सेट होगा। ठीक है? तो ये सॉफ्टवेयर खुद कर ले बेस्ट है वरना एडमिन या स्टाफ के बाद खुद ऑप्शन भी है।
[04:43:47] [Guri] ओके।
[04:44:47] [Sir] कि हां भैया ये मेरा डिफॉल्ट है। बैंक डिटेल्स। एचआर ही करेगा, एम्प्लॉई तो करेगा नहीं। ठीक है?
[04:50:47] [Sir] एचआर से ही होगा सारा ऑपरेशन। क्लियर है?
[04:52:47] [Guri] हम्म।
[04:53:47] [Sir] ये चीज आ गई। करने का स्टाफ मैनेजमेंट पूरा?
[04:55:47] [Guri] हम्म।
[04:57:47] [Sir] डन है?
[04:57:47] [Guri] हम्म।
[04:58:47] [Sir] जैसे ही वो स्टाफ बनाएगा, एक टेबल और होगी यूजर्स यूजर्स आइडेंटिटी या जो भी।
[05:05:47] [Sir] किसके लिए? यूजर बनाने के लिए।
[05:08:47] [Sir] हर स्टाफ के साथ दो-तीन बटन होंगे मेन। ठीक है?
[05:12:47] [Sir] बटन जैसे ऐसे बना दिए कि उसको इस स्टाफ को यूजर लॉगिन देना ही नहीं देना है। इनेबल, डिसेबल।
[05:22:47] [Guri] ठीक है।
[05:22:47] [Sir] इनेबल किया तो उसका लॉगिन इनेबल हो गया। क्या हो गया?
[05:24:47] [Guri] लॉगिन इनेबल हो गया।
[05:26:47] [Sir] और जैसे ही इसको इनेबल करेगा, जो भी ओटीपी मोड तुरंत उस ओटीपी मोड से उसको मैसेज चला जाएगा, "नाउ यू आर इनेबल्ड फॉर लॉगिन।" "यू आर डिसेबल्ड फॉर लॉगिन।" ठीक है जी?
[05:38:47] [Sir] क्लियर?
[05:39:47] [Sir] और उसकी आईडी चली जाएगी वन के सॉफ्टवेयर से है ना? लास्ट में 03 जो भी है वो चली जाएगी। समझ गया?
[05:45:47] [Sir] एक बनेगा इनेबल लॉगिन हो गया। ठीक है? एक बनेगा पासवर्ड का। पासवर्ड का। तो दो ऑप्शन होंगे या तो आप रीसेट पासवर्ड करोगे। जो भी रीसेट करोगे पासवर्ड वो पासवर्ड उसको ओटीपी मोड से चला जाएगा। उसको हमारे पास आने की जरूरत नहीं, आपको बताने की जरूरत नहीं। उसको नया पासवर्ड पहुंच गया।
[06:03:47] [Guri] पहुंच गया।
[06:04:47] [Sir] और जब भी इसमें एक चेक तूने सॉफ्टवेयर में करना है, जब भी पासवर्ड चेंज हुआ है बाय एडमिन, बाय?
[06:10:47] [Guri] एडमिन।
[06:11:47] [Sir] एडमिन। और यूजर या स्टाफ या स्टूडेंट कोई भी जब भी लॉगिन करे तो उसको सबसे पहले रिस्ट्रिक्शन लग जाए कि उसको पासवर्ड चेंज करना है उसके बाद ही वो आगे कंटिन्यू कर सके। कंपलसरी।
[06:21:47] [Guri] अच्छा।
[06:23:47] [Sir] क्लियर?
[06:24:47] [Guri] ठीक है।
[06:25:47] [Sir] ठीक है? दूसरा होगा उसको खुद रीसेट करने का लिंक भेज दिया। जो भी ओटीपी मोड है उससे लिंक चला गया, वो अपना आप करेगा। फिर उसको रिस्ट्रिक्शन नहीं है ना उसने खुद ही किया है।
[06:34:47] [Guri] हम्म हम्म हम्म हम्म।
[06:34:47] [Sir] समझ में आ गई ये चीज? तो एक आ गया हमारा पासवर्ड के लिए। ठीक है? यूजर लॉगिन हो गया, पासवर्ड हो गया। ठीक है? और बाकी चलो जो भी है ना। लॉग्स देखने के, उसकी ऑर्गेनाइजेशन जर्नी देखने की ये सारे बटन।
[06:51:47] [Guri] हां। स्टेटस तो इसमें ही आ गया।
[06:53:47] [Sir] इनेबल डिसेबल। ये यूजर लॉगिन इनेबल डिसेबल हो रहा है ये स्टाफ है एक्टिव है वो एक अलग चीज है।
[06:59:47] [Guri] अच्छा।
[07:01:47] [Sir] ये तो यूजर लॉगिन है कि ऐप पे या सॉफ्टवेयर पे वो लॉगिन कर सकता है या नहीं कर सकता। ठीक है? पर यहां से एचआर जब उस बेसिक इंफॉर्मेशन में जाएगा तो उसके हां उसके एचआर के पास ये भी ऑप्शन आएगा कि अपडेट एम्प्लॉई स्टेटस। एम्प्लॉई?
[07:17:47] [Guri] स्टेटस।
[07:18:47] [Sir] ये यूजर स्टेटस है ये एम्प्लॉई स्टेटस। तो वो एक्टिव है, वो रिजाइन है, वो टर्मिनेटेड है, वो एओएल है।
[07:28:47] [Sir] गायब है, पता नहीं।
[07:29:47] [Guri] अच्छा।
[07:29:47] [Sir] एब्सेंट ऑन लीव।
[07:31:47] [Guri] अच्छा अच्छा अच्छा।
[07:32:47] [Sir] ठीक है? हमें पता नहीं। तो चार ही स्टेटस होते हैं कोई पांच। ये भी मास्टर टेबल में जाएगा। ये जो इनेबल डिसेबल ये तो नहीं जाएगा, ये भी नहीं जाएगा। ये ये मास्टर टेबल में जाएगा कि एक एम्प्लॉई का क्या-क्या स्टेटस हो सकता है।
[07:42:47] [Guri] इनेबल डिसेबल मास्टर में क्यों नहीं जाए? बिकॉज़ ये भी तो।
[07:45:47] [Sir] वो ही तो ऑप्शन है इनेबल डिसेबल। वो तो फिक्स ही है ना। जहां पे ऑप्शंस बढ़ सकते हैं परमानेंट वो मास्टर टेबल में जाते हैं। वो जो चेंज नहीं होते। जो?
[07:53:47] [Guri] चेंज नहीं होते।
[07:55:47] [Guri] बढ़ सकते हैं तो उसमें।
[07:56:47] [Sir] कैसे बढ़ेगा? क्या बढ़ेगा उसके अंदर? उसको बीच में कहां लटकाएगा? तीसरा ऑप्शन बताओ मुझे।
[08:02:47] [Guri] इनेबल डिसेबल। हां।
[08:03:47] [Sir] लॉगिन करेगा या नहीं करेगा बस। ये नहीं आएगा। पासवर्ड भेजने के दो तरीके हैं। तीसरा तरीका तो नहीं बनता ना?
[08:10:47] [Guri] हम्म।
[08:11:47] [Sir] मास्टर टेबल है जो एक स्टैंडर्ड बन जाता है जिसको अलग-अलग जगह यूज कर सकते हैं। तो ये जाएगा मास्टर टेबल में।
[08:20:47] [Guri] ठीक है।
[08:20:47] [Sir] कि ये एम्प्लॉई का स्टेटस क्या-क्या हो सकता है। कोई पांचवा स्टेटस आएगा यहां ऐड कर दो वो अपने आप मेनू में आ जाएगा।
[08:26:47] [Guri] ठीक है, ठीक है, ठीक है।
[08:28:47] [Sir] समझ में आ गया? एक्टिव है, रिजाइन है। जैसे ही वो रिजाइन को करेगा या टर्मिनेशन करेगा या एडब्ल्यूएल क्लिक करेगा, है ना? तो ऑटोमेटिक उससे पूछा जाएगा फॉर्म में कि उसकी किस डेट से मतलब कि किस डेट को ये लगाया है, एप्लीकेबल है और उसकी लास्ट वर्किंग डेट क्या है।
[08:50:47] [Guri] ठीक है।
[08:53:47] [Sir] ठीक है जी? अगर वो इमीडिएट है। ठीक है जी? और डैशबोर्ड पे देखो उसके एडमिन एचआर के एडमिन पे तो रिजल्ट आएगा ही आएगा ना कि इतने स्टाफ का लास्ट वर्किंग डे क्लोज आ गया उनको डीएक्टिवेट करो। क्या करो?
[09:08:47] [Guri] डीएक्टिवेट।
[09:09:47] [Sir] तो यहां पे आ जाएगा डीएक्टिवेटेड।
[09:16:47] [Guri] हां।
[09:17:47] [Sir] अब डीएक्टिवेटेड आएगा जैसे ही वो दिखाएगा आप उसको बटन दबाओगे वो डीएक्टिवेटेड वाली लिस्ट में आ जाएगा।
[09:22:47] [Guri] हम्म।
[09:23:47] [Sir] और कल को जो जर्नी खोलोगे तो डीएक्टिवेट तो सभी का सेम है ना? पर उसके पीछे वाली लाइन में दिखाएगा वो टर्मिनेटेड था या वो रिजाइन था। जो जर्नी है, लॉग्स तो बन रहे हैं ना?
[09:35:47] [Guri] एंड इसका।
[09:36:47] [Sir] लॉग के अंदर एक चीज याद रखना लॉग टाइप बहुत जरूरी होगा।
[09:41:47] [Sir] तो यहां पे आ जाएगा एम्प्लॉई स्टेटस लॉग टाइप। ताकि हमें सिर्फ स्टेटस देखना हो। पता नहीं उसने कितने एक्शन किए हैं, है ना? तो लॉग टाइप के अंदर क्या-0क्या होगा स्टाफ को लेके? स्टाफ एक तो क्या करता है? स्टाफ इंफॉर्मेशन। क्या?
[09:55:47] [Guri] स्टाफ इंफॉर्मेशन।
[09:56:47] [Sir] कोई स्टाफ इंफॉर्मेशन चेंज हुई है। एक लॉग टाइप कैसा हो जाएगा स्टाफ के लिए? अ डॉक्यूमेंट मैनेजमेंट। कोई डॉक्यूमेंट अपलोड या वो किया है। एक आ जाएगा उसके पास अ यूजर मैनेजमेंट से रिलेटेड। कि उसको एक्टिव किया है, डीएक्टिव किया है, पासवर्ड चेंज किया है वो सारा यहां आ जाएगा।
[10:14:47] [Guri] यूजर मैनेजमेंट में।
[10:15:47] [Sir] ठीक है? किस दिन किया, किस टाइम किया, क्या किया। अच्छा टाइप में ये किया फिर यहां समरी। कुछ बाय डिफॉल्ट आएगी, कई जगह भरने के लिए मांगेगा।
[10:25:47] [Guri] ठीक है।
[10:26:47] [Sir] ठीक है? फिर उसके बाद आ जाएगा किसने किया? उसकी आईडी। किस डिवाइस से किया, किस प्लेटफॉर्म से किया, किस आईपी से किया। ये तो तीन हर जगह फिक्स है ये याद रखना।
[10:38:47] [Guri] ठीक है।
[10:40:47] [Guri] डिवाइस फिंगरप्रिंट।
[10:41:47] [Sir] कल को कल को वो बलजिंदर बोलता है मैंने नहीं किया। पर पता लगा उसको वो लॉग में दिखा रहा है आईफोन था। भैया तेरा ही तो आईफोन है, तेरे पास भी आईफोन है। सेम है ना फिर वो नहीं बोल सकता ना? वो बोलेगा सर मैंने तो नहीं किया। मैं बोलूंगा तेरा Vivo का फोन है। कहता हां, तो देख Vivo का लॉग आया।
[10:58:47] [Sir] समझ में आ गई बात? ये तीन तो करना है। तो यूजर मैनेजमेंट इसी तरह से आ जाएगा एम्प्लॉई स्टेटस। इसी तरह से एकेडमिक का बनेगा। एकेडमिक्स जर्नी, एकेडमिक लॉग्स, है ना? कि जो उसने टाइम टेबल ऐड किया है, कोई डिलीट किया है वो सारे लॉग्स इधर आएंगे उसके नाम से।
[11:15:47] [Guri] ठीक है।
[11:15:47] [Sir] टेबल एक ही होगी। लॉग टाइप के अंदर हेडिंग अलग-अलग होती जाएगी। उसे फिल्टर करना हमें आसान है।
[11:21:47] [Guri] हम्म हम्म।
[11:22:47] [Guri] ओके।
[11:24:47] [Sir] फिर इसकी एक पूरी अलग से पैनल बनेगा एडमिन के अंदर ही लॉग्स चेक करने का। डीबी थोड़ी खोलेंगे बार-बार।
[11:33:47] [Guri] ओके।
[11:34:47] [Sir] बना देगा ये?
[11:34:47] [Guri] हां जी, हां जी, हां जी।
[11:36:47] [Sir] पक्का?
[11:38:47] [Sir] इतना बहुत है आगे बताऊं और?
[11:40:47] [Guri] बहुत है ये बिकॉज़ मैं जो आपने पहले भी बोला है उसको मतलब ए टू जेड करनी है।
[11:47:47] [Sir] वो तो मैं दोबारा बताऊंगा पूरा प्री एडमिशन का।
[11:50:47] [Guri] ओके, थैंक यू।
[11:51:47] [Sir] ठीक है? स्टूडेंट पे आएंगे जब। अभी सिर्फ टीचर ऐड करना बता रहा हूं, टीचर मैनेज करना। जब तू मुझे ये बना के दिखा देगा।
[11:59:47] [Guri] हम्म।
[12:00:47] [Sir] ठीक है? तेरे पास नेक्स्ट सैटरडे संडे तक का टाइम है। ताकि नेक्स्ट तू फिर आए जितना ये पूरा कर लिया मुझे वेब और मोबाइल दोनों पे दिखाना है।
[12:11:47] [Guri] ऐप भी बना के फ्लटर में।
[12:14:47] [Guri] ठीक है।
[12:15:47] [Guri] जो कि डाटाबेस के साथ कनेक्टेड हो विद फुल फंक्शनैलिटी।
[12:19:47] [Sir] बीच लोकल होस्ट पे तो मुझे चाहे लाइव मत कर मुझे ऐसे दिखा दे।
[12:22:47] [Guri] हां।
[12:23:47] [Guri] मैंने रेलवे में एक्चुअली होस्टिंग ले रखी है जी।
[12:27:47] [Guri] हैं? अ मेरे पास एक्चुअली सर्वर पे होस्टिंग है अभी।
[12:33:47] [Sir] नहीं तो जो मोबाइल की ऐप है वो गूगल डेवलपर अकाउंट से लाइव करता है या कैसे करता है? एपीके कहां रखता है?
[12:41:47] [Guri] सर जो जो सारा डाटाबेस जो भी सारी डिप्लॉयमेंट होती है, है ना? वो रेलवे एक डाटाबेस को बैक एंड को स्टोर करने के लिए एक प्लेटफार्म है उस पे चला जाता है ये सब कुछ। जिसको वी कैन एक्सेस थ्रू अगर ऐप बनाई तो उसका फ्रंट एंड जो बैक एंड से कनेक्टेड है बैक एंड सीधा जा के हमारे रेलवेज के साथ हमारा डाटाबेस तो उसके क्वेरीज में फ्लटर में है। मुझे बेसिकली ये अभी आ रहा है दिमाग में।
[13:10:47] [Sir] नहीं तूने कोई ऐप लाइव की है?
[13:12:47] [Guri] हां जी। अ अभी अभी की है अभी।
[13:15:47] [Sir] ऐप?
[13:15:47] [Guri] वो वेब ऐप है।
[13:16:47] [Sir] गूगल स्टोर में की है?
[13:17:47] [Guri] ना ना ना वो वेब ऐप पे ही है अभी लाइक ऐसे नहीं की।
[13:22:47] [Sir] वही पूछ रहा हूं ऐप नहीं वो तो वेबसाइट ही है।
[13:24:47] [Guri] वेब ऐप वेबसाइट ही है।
[13:25:47] [Sir] यूआरएल से ही चला रहा है।
[13:26:47] [Guri] हां जी, हां जी।
[13:27:47] [Sir] मैं ऐप पूछ रहा हूं जो तू बलजिंदर को स्क्रीन पे दिखा रहा था वो वेब ऐप थी ना?
[13:31:47] [Guri] हां जी, हां जी।
[13:32:47] [Sir] ठीक है। कोई नहीं गूगल का कौन सा करता है? ढाई हजार रुपए है बस वन टाइम।
[13:38:47] [Guri] ठीक है। या वन टाइम तो है मेरे मैं थोड़ा सा जुगाड़ कर रहा था मेरा उधर से हो जाए तो वो भी कर दूंगा।
[13:44:47] [Sir] क्या?
[13:45:47] [Guri] लाइक पैसे का। बट।
[13:46:47] [Sir] अभी जरूरत नहीं है। वो जब टाइम आएगा तू सही कर गया तो मैंने तो तुझे मैं ही कर रहा हूं। तो बंदे से बात हुई है बाद में।
[13:53:47] [Sir] ठीक है? देख।
[13:57:47] [Sir] मैं तुझे बताता हूं ऑनेस्टली। ठीक है?
[13:59:47] [Guri] मैं रिकॉर्डिंग बंद कर देता हूं। एक सेकंड, एक सेकंड, बंद हो जा।

---

**2. Exhaustive Requirements, Architectural Decisions, Database Tables, Field Definitions, UI Rules, Workflows, Roles, Edge Cases, and Specific Instructions:**

**A. Core Concepts & Architectural Decisions:**

1.  **Software Journey / Organization Journey:**
    *   **Requirement:** Every action by a user (staff/student/admin) must be logged to create a "software journey." This tracks changes in status, roles, and activities over time.
    *   **Purpose:** Crucial for analytics, accountability (like a "CBI investigation" trail), and historical record-keeping.
    *   **Architectural Decision:** A dedicated `logs` database/table is required for this, separate from the main application database. (01:38)
    *   **UI:** A dedicated panel within the Admin interface for checking logs. (11:24-11:27)

2.  **Master Tables vs. Fixed Options:**
    *   **Master Tables:**
        *   **Requirement:** For options that can *grow* or *change* over time (e.g., Employee Status: Active, Resigned, Terminated, AWOL), these should be stored in master tables.
        *   **Benefit:** Allows dynamic additions to menus and options without code changes. (07:48-07:51, 08:11-08:15)
    *   **Fixed Options:**
        *   **Requirement:** For binary or limited choices that are unlikely to change (e.g., Enable/Disable login, Password reset methods), these should be hardcoded.
        *   **Example:** Login status (enable/disable) and password reset methods (admin reset/self-reset) are fixed. (07:46-07:48, 08:03-08:05, 08:08-08:09)

3.  **Multi-Record Handling:**
    *   **Requirement:** For certain entities, multiple records are possible and must be supported (e.g., multiple addresses, bank details, qualifications, certifications, experiences).
    *   **Architectural Decision:** Each of these should have its own separate database table, linked to the main staff/user record. (04:06-04:17)
    *   **Default Setting:** For multi-record fields, there must be a mechanism to set a "default" record (e.g., highest qualification, last experience). This default should be displayed prominently. (04:22-04:36)

4.  **OTP Mode for Communication:**
    *   **Requirement:** Password resets and login enablement/disablement messages should be sent via OTP mode (SMS/Email). (05:29-05:31, 05:57-05:58, 06:28-06:29)

**B. User/Staff Management Requirements:**

1.  **Staff Information Management:**
    *   **Basic Information:** Core details of the staff.
    *   **Additional Information:** Supplementary details.
    *   **Address:** Separate table for multiple addresses.
    *   **Bank Details:** Separate table for multiple bank accounts.
    *   **Qualifications:** Separate table for multiple qualifications.
    *   **Certifications:** Separate table for multiple certifications.
    *   **Experience:** Separate table for multiple work experiences.
    *   **Default Selection:** For multi-record fields (address, bank, qual, cert, exp), a default must be set (e.g., highest qualification, last experience). This default should be automatically selected or configurable by HR. (04:02-04:36)

2.  **Staff Status Management (Employee Status - Master Table):**
    *   **Statuses (Master Table):**
        *   **Active:** Currently employed.
        *   **Resigned:** Left the organization.
        *   **Terminated:** Employment ended by the organization.
        *   **AWOL (Absent Without Leave):** Missing, status unknown. (07:21-07:26)
    *   **Workflow:** When an HR user changes a staff member's status (to Resigned, Terminated, or AWOL), the system must prompt for:
        *   **Effective Date:** From which date the status is applicable.
        *   **Last Working Date:** The actual last day of work. (08:41-08:49)
    *   **Dashboard Alert:** The HR Admin dashboard should display alerts for staff whose last working day is approaching or has passed, prompting for deactivation. (09:01-09:07)
    *   **Deactivation:** A button or workflow to deactivate staff based on their last working day. (09:07-09:11)
    *   **Journey Logging:** Even if a staff is "Deactivated" (a UI state), the underlying log should show the specific reason (Terminated, Resigned, etc.) for their deactivation. (09:23-09:30)

3.  **Staff Rejoining:**
    *   **Edge Case:** The system must handle staff members who leave the organization and then rejoin. (02:45-02:46)
    *   **Status Management:** When rejoining, the system needs to differentiate between a "rejoin" and a "fresher" status for the employee. (02:54-02:58)
    *   **Software Journey:** The software journey should reflect the entire history, including previous employment periods and rejoining events. (03:01-03:06)

4.  **Designation Changes:**
    *   **Types of Changes:**
        *   **Promotion:** Higher role.
        *   **Demotion:** Lower role.
        *   **Additional Role:** Added responsibility/role.
        *   **Role Switch:** Changed to a different role. (03:11-03:22)
    *   **Workflow:** When a designation changes, the system should prompt the HR user to specify the type of change. (03:13-03:19)
    *   **Software Journey:** All designation changes must be logged in the software journey. (03:35-03:38)

5.  **User Login Management (for Staff/Students):**
    *   **Enable/Disable Login:** A button to enable or disable login access for a specific staff member. (05:17-05:21)
    *   **OTP Notification:** When login is enabled or disabled, an OTP message should be sent to the user informing them of the change. (05:28-05:34)
    *   **User ID:** The system should generate and communicate the user's ID (e.g., `03`). (05:39-05:43)
    *   **Distinction:** This is *user login* status (can they access the app/software?) and is distinct from *employee status* (are they actively employed?). (06:53-07:06)

6.  **Password Management:**
    *   **Reset Password (Admin initiated):**
        *   **Functionality:** Admin can reset a user's password.
        *   **Notification:** The new password is sent to the user via OTP mode. (05:54-06:02)
        *   **Compulsory Change:** If Admin resets the password, the user *must* change it on their first login after the reset. This is a compulsory step. (06:04-06:21)
    *   **Self-Reset Password (User initiated):**
        *   **Functionality:** User can request a password reset link (sent via OTP mode).
        *   **No Compulsory Change:** If the user initiates the reset themselves, there is no compulsory password change on their next login. (06:26-06:33)

**C. Logging and Analytics (Software Journey):**

1.  **Comprehensive Logging:**
    *   **Requirement:** Every action by every user (staff, student, admin) must be logged.
    *   **Examples of actions to log:**
        *   Uploading/changing documents (including title). (00:00-00:04)
        *   Viewing a user/profile/panel. (01:21-01:23)
        *   Visiting any page within the application. (01:34-01:36)
        *   Changes to staff information. (09:56-09:57)
        *   User management actions (activate, deactivate, password change). (10:08-10:12)
        *   Academic actions (e.g., time table add/delete). (11:10-11:12)
    *   **Purpose:** To enable analytics (e.g., which modules/pages are used most), ensure accountability, and maintain a detailed historical trail. (01:26-01:29, 01:43-01:46)

2.  **Log Details:**
    *   **Log Type:** Categorization of the action (e.g., Employee Status, Staff Information, Document Management, User Management, Academic). This is crucial for filtering and analysis. (09:36-09:38, 09:41-09:43, 09:53-10:12, 11:17-11:19)
    *   **Date & Time:** When the action occurred. (02:38-02:40, 10:16-10:17)
    *   **Action/Summary:** A description of the specific action taken (e.g., "User added," "Password changed"). Some summaries will be system-generated by default, while others may require user input. (10:18-10:25)
    *   **Actor ID:** The ID of the user who performed the action. (10:28-10:31)
    *   **Device:** The device from which the action was performed (e.g., iPhone, Vivo). (10:32-10:33, 10:45-10:48, 10:54-10:56)
    *   **Platform:** The operating system/platform used. (10:34-10:35)
    *   **IP Address:** The IP address from which the action originated. (10:35-10:36)
    *   **Fixed Fields:** Device, Platform, and IP Address are mandatory and must be captured for every log entry. (10:36-10:38)

3.  **Log Viewing Interface:**
    *   **UI:** An Admin panel specifically designed for viewing and filtering logs. (11:24-11:27)
    *   **Filtering:** Ability to filter logs by `Log Type` (e.g., only show Employee Status changes, or only Document Management actions). (11:17-11:21)
    *   **Display:** The interface should display `Date & Time`, `Action/Summary`, `Actor ID`, `Device`, `Platform`, and `IP Address` for each log entry. (10:16-10:36)

**D. Database Tables & Field Definitions (Explicitly Mentioned/Implied):**

1.  **`Documents` Table:**
    *   `title`: Title of the document. (00:01-00:02)
    *   `document_type`: What kind of document it is (implied). (00:02-00:03)

2.  **`Employee` Table (or `Staff` Table):**
    *   `date_of_joining`: Date when the employee joined. (00:15-00:16)
    *   `date_of_resigning`: Date when the employee resigned. (00:18-00:19)
    *   `last_day`: Last working day. (00:20-00:21)
    *   `status`: Employee's current status (Active, Resigned, Terminated, AWOL). This will be a foreign key to `Employee_Status_Master`. (07:15-07:26, 08:20-08:22)
    *   `designation`: Employee's current designation (Teacher, Professor, etc.). (03:09-03:11)

3.  **`Users` Table (or `Users_Identity` Table):**
    *   `user_id`: Unique identifier for the user. (05:39-05:43)
    *   `login_status`: Boolean (Enabled/Disabled) for login access. (05:20-05:21)

4.  **`Logs` Table (separate DB):**
    *   `log_type`: (e.g., Employee Status, Staff Information, Document Management, User Management, Academic). (09:41-09:43, 09:53-10:12, 11:17-11:19)
    *   `date_time`: Timestamp of the action. (10:16-10:17)
    *   `action_summary`: Description of the action. (10:21-10:22)
    *   `actor_id`: ID of the user who performed the action. (10:28-10:31)
    *   `device`: Device used (e.g., iPhone, Vivo). (10:32-10:33)
    *   `platform`: OS/Platform used. (10:34-10:35)
    *   `ip_address`: IP address. (10:35-10:36)

5.  **Master Tables:**
    *   **`Employee_Status_Master` Table:**
        *   `status_id` (Primary Key)
        *   `status_name` (e.g., Active, Resigned, Terminated, AWOL). (07:34-07:35, 07:39-07:42, 08:17-08:22)
    *   **`Designation_Change_Type_Master` Table:**
        *   `type_id` (Primary Key)
        *   `type_name` (e.g., Promotion, Demotion, Additional Role, Role Switch). (03:15-03:22)
    *   **`Qualification_Master` Table:** (Implied for multi-record handling)
    *   **`Certification_Master` Table:** (Implied for multi-record handling)
    *   **`Experience_Master` Table:** (Implied for multi-record handling)
    *   **`Address_Master` Table:** (Implied for multi-record handling)
    *   **`Bank_Details_Master` Table:** (Implied for multi-record handling)

**E. Roles & Responsibilities:**

1.  **HR (Human Resources):**
    *   **Responsibilities:** Manages employee details, status, and login access. (04:48-04:49, 04:51-04:52, 07:07-07:08)
    *   **Configuration:** Responsible for setting default multi-records (e.g., default bank account, highest qualification). (04:48-04:49)
    *   **Alerts:** Receives dashboard alerts for staff deactivation. (09:01-09:07)
2.  **Admin:**
    *   **Permissions:** Can reset user passwords. (06:09-06:11)
    *   **Access:** Has access to logs and analytics. (01:26-01:27, 01:43-01:44)
3.  **Staff/User/Student:**
    *   **Access:** Can login (if enabled by HR/Admin).
    *   **Password Policy:** May be required to change password on first login if Admin reset it. (06:14-06:20)
    *   **Self-Service:** Can initiate self-password reset. (06:26-06:28)

**F. UI Rules & Workflows:**

1.  **Document Upload Workflow:** When uploading a document, the user provides a title, which is then stored. (00:00-00:04)
2.  **Employee Detail Form:**
    *   **Fields:** Includes `Date of Joining`, `Date of Resigning`, and `Last Day`. (00:15-00:21)
    *   **Designation Change:** When changing a designation, a prompt will appear asking for the type of change (Promotion, Demotion, etc.). (03:13-03:19)
3.  **Staff Management Interface:**
    *   **Login Control:** Buttons for `Enable Login` and `Disable Login` for each staff member. (05:17-05:21)
    *   **Password Control:** Buttons for `Reset Password` (Admin-initiated) and `Send Self-Reset Link` (User-initiated). (05:53-05:55, 06:26-06:28)
    *   **Status Update:** An option to `Update Employee Status` (Active, Resigned, Terminated, AWOL). (07:15-07:26)
    *   **Status Change Form:** When changing employee status to Resigned, Terminated, or AWOL, a form will appear asking for `Effective Date` and `Last Working Date`. (08:31-08:49)
    *   **Dashboard Alerts:** The HR dashboard will display alerts for staff whose `Last Working Day` is close or has passed, with an option to `Deactivate` them. (09:01-09:07)
4.  **Login Flow:**
    *   If an Admin resets a user's password, the user is forced to change their password on their first subsequent login. (06:15-06:20)
5.  **Logs Panel (Admin):**
    *   **Filtering:** Provides filter options based on `Log Type` (e.g., Staff Information, Document Management, User Management, Academic). (11:17-11:21)
    *   **Display:** Displays `Date & Time`, `Action/Summary`, `Actor ID`, `Device`, `Platform`, and `IP Address` for each log entry. (10:16-10:36)

**G. Specific Instructions & Project Management:**

1.  **Development Scope for Current Phase:** Focus on Staff Management first, specifically "Teacher Add" and "Teacher Manage" functionalities. Student management (including Pre-Admission, Admissions CRM, Partner Portal, Telephony/Calling) will be discussed in a later phase. (11:47-11:56)
2.  **Deadline:** The current scope needs to be completed by the next Saturday/Sunday. (12:01-12:03)
3.  **Demonstration Requirement:** The completed work must be demonstrated on both web and mobile platforms. (12:07-12:08)
4.  **Mobile App Technology:** The mobile application should be built using Flutter. (12:11-12:13)
5.  **Deployment for Demo:**
    *   For the demo, showing the application on a local host is acceptable; a live deployment is not strictly required at this stage. (12:19-12:21)
    *   Guri mentions using "Railway" for hosting the database/backend deployment. (12:23-12:25, 12:43-12:54)
    *   Sir clarifies that a "web app" (accessed via URL) is different from a "mobile app" deployed on Google Play Store. (13:15-13:27)
    *   **Google Play Store Cost:** The one-time fee for Google Play Store developer account is ₹2500 (approx. $25). (13:34-13:36)
    *   **Incentive:** Sir offers to cover the Google Play Store fee if Guri successfully delivers the project. (13:46-13:52)

**H. Details Not Explicitly Covered (but implied by ERP context):**

*   **UID format:** Not specified, but implied for users/staff.
*   **College codes, state codes, department handling:** Not explicitly discussed in detail, but would be part of the broader ERP system's master data.
*   **UI look and feel, colors, headers:** Not discussed in this segment.

---