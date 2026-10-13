/**
 * SMART OPD - DEPARTMENT ROUTING SUGGESTIONS
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.Departments = {
  ids: [
    'general_medicine',
    'general_surgery',
    'pediatrics',
    'ob_gyn',
    'orthopedics',
    'cardiology',
    'dermatology',
    'ophthalmology',
    'ent',
    'neurology_psychiatry'
  ],

  matchers: [
    ['cardiology', ['heart', 'cardiac', 'chest pain', 'chest tightness', 'ecg', 'palpitation', 'blood pressure', 'hypertension', 'दिल', 'छाती में दर्द', 'सीने में दर्द', 'धड़कन', 'ब्लड प्रेशर', 'उच्च रक्तचाप', 'હૃદય', 'છાતીમાં દુખાવો', 'ધબકારા', 'બ્લડ પ્રેશર']],
    ['ob_gyn', ['pregnant', 'pregnancy', 'antenatal', 'postnatal', 'menstrual', 'period pain', 'irregular period', 'reproductive', 'vaginal', 'गर्भवती', 'गर्भावस्था', 'मासिक धर्म', 'पीरियड', 'प्रसव', 'गर्भાશય', 'ગર્ભાવસ્થા', 'માસિક', 'પ્રસૂતિ']],
    ['pediatrics', ['pediatric', 'paediatric', 'infant', 'newborn', 'baby', 'child', 'children', 'son', 'daughter', 'adolescent', 'vaccination', 'immunization', 'growth monitoring', 'शिशु', 'बच्चा', 'बच्चे', 'टीकाकरण', 'બાળક', 'બાળકો', 'રસીકરણ']],
    ['ophthalmology', ['eye', 'vision', 'eyesight', 'blurry vision', 'blurred vision', 'red eye', 'आंख', 'आँख', 'नजर', 'दृष्टि', 'આંખ', 'દ્રષ્ટિ']],
    ['dermatology', ['skin', 'rash', 'itch', 'itching', 'hair loss', 'nail', 'eczema', 'दाने', 'खुजली', 'त्वचा', 'बाल झड़ना', 'ચામડી', 'ખંજવાળ', 'વાળ ખરવા']],
    ['orthopedics', ['bone', 'joint', 'fracture', 'sprain', 'back pain', 'knee pain', 'muscle pain', 'shoulder pain', 'हड्डी', 'जोड़', 'फ्रैक्चर', 'मोच', 'कमर दर्द', 'घुटने में दर्द', 'સાંધા', 'હાડકું', 'મચકોડ', 'કમરનો દુખાવો']],
    ['ent', ['ear', 'earache', 'nose', 'throat', 'sinus', 'hearing', 'tonsil', 'sore throat', 'कान', 'नाक', 'गला', 'साइनस', 'सुनाई', 'કાન', 'નાક', 'ગળું', 'સાઇનસ', 'સાંભળવામાં']],
    ['general_surgery', ['wound', 'cut', 'stitch removal', 'stitches', 'suture', 'dressing', 'surgical', 'surgery follow-up', 'operation follow-up', 'घाव', 'कट', 'टांके', 'पट्टी', 'સર્જરી', 'ઘા', 'ટાંકા', 'પાટો']],
    ['neurology_psychiatry', ['neurology', 'nerve', 'seizure', 'migraine', 'headache', 'numbness', 'tingling', 'sleep issue', 'insomnia', 'anxiety', 'depression', 'mental health', 'counseling', 'सिरदर्द', 'माइग्रेन', 'दौरा', 'सुन्नपन', 'नींद', 'चिंता', 'अवसाद', 'मानसिक स्वास्थ्य', 'માથાનો દુખાવો', 'આંચકી', 'સુન્ન', 'ઊંઘ', 'ચિંતા', 'માનસિક સ્વાસ્થ્ય']]
  ],

  suggestFromComplaint(complaint) {
    const text = String(complaint || '').toLocaleLowerCase();
    if (!text.trim()) return '';
    for (const [department, keywords] of this.matchers) {
      if (keywords.some(keyword => {
        if (!/^[a-z\s-]+$/i.test(keyword)) return text.includes(keyword);
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z])${escapedKeyword}([^a-z]|$)`, 'i').test(text);
      })) return department;
    }
    return 'general_medicine';
  },

  label(department, translate = key => key) {
    return this.ids.includes(department) ? translate(`department.${department}`) : '';
  }
};
