import type { RoundKey } from '../types';

export interface RoundRuleSet {
  title: string;
  subtitle: string;
  rules: string[];
}

export const roundRules: Partial<Record<RoundKey, RoundRuleSet>> = {
  round1: {
    title: 'Round 1',
    subtitle: 'Picture Question',
    rules: [
      'દરેક સાચા જવાબ માટે ૫ ગુણ મળશે.',
      'દરેક ટીમને ૨ પ્રશ્નો પૂછવામાં આવશે.',
      'દરેક પ્રશ્ન માટે ૩૦ સેકન્ડનો સમય આપવામાં આવશે.',
      'પ્રશ્ન અન્ય ટીમને પાસ કરવામાં આવશે નહીં.',
    ],
  },
  round2: {
    title: 'Round 2',
    subtitle: 'Multiple Choice Challenge',
    rules: [
      'દરેક સાચા જવાબ માટે ૧૦ ગુણ મળશે.',
      'દરેક ટીમને ૨ પ્રશ્નો પૂછવામાં આવશે.',
      'માત્ર એક જ વિકલ્પ પસંદ કરવો રહેશે.',
      'પ્રશ્ન અન્ય ટીમને આપવામાં આવશે નહીં.',
    ],
  },
  round3: {
    title: 'Round 3',
    subtitle: 'Bhajan Tune Challenge',
    rules: [
      'દરેક સાચા જવાબ માટે ૨૦ ગુણ મળશે.',
      'સૌથી પહેલા બઝર દબાવનાર ટીમને જવાબ આપવાની પ્રથમ તક મળશે.',
      'જો પ્રથમ ટીમ ખોટો જવાબ આપે, તો ત્યારબાદ બઝર દબાવનાર ટીમને તક મળશે.',
      'દરેક ટીમને માત્ર એક જ જવાબ આપવાની તક મળશે.',
    ],
  },
  round4: {
    title: 'Round 4',
    subtitle: 'Spin Wheel Challenge',
    rules: [
      'દરેક પ્રશ્ન માટે ૨૦ ગુણ મળશે.',
      'ટીમ સ્પિનર ફેરવીને એક વિષય પસંદ કરશે.',
      'પસંદ કરેલા વિષય પર બોલવા માટે ૨ મિનિટનો સમય આપવામાં આવશે.',
      'નિર્ણાયકો આત્મવિશ્વાસ, જ્ઞાન, રજૂઆત, પ્રવાહિતા અને સર્જનાત્મકતા આધારે ગુણ આપશે.',
    ],
  },
};
