import type { SectionId } from '@/features/mentors/section';

import type { Language } from './i18n';

type StatusLabels = Record<Exclude<Language, 'mk'>, string>;

export const statusTranslations: Record<
  SectionId,
  Readonly<Record<string, StatusLabels>>
> = {
  diplomas: {
    Архива: { en: 'Archived', sq: 'I arkivuar', tr: 'Arşivlendi' },
    'Архивирање на дипломската од продеканот за настава': {
      en: 'Thesis archiving by the Vice Dean for Teaching',
      sq: 'Arkivimi i punimit nga prodekani për mësim',
      tr: 'Eğitimden sorumlu dekan yardımcısının tezi arşivlemesi',
    },
    'Валидирање на услови за одбрана': {
      en: 'Validation of defense requirements',
      sq: 'Verifikimi i kushteve për mbrojtje',
      tr: 'Savunma koşullarının doğrulanması',
    },
    'Валидирање на услови за одбрана од студентска служба': {
      en: 'Validation of defense requirements by Student Services',
      sq: 'Verifikimi i kushteve për mbrojtje nga shërbimi studentor',
      tr: 'Öğrenci işlerinin savunma koşullarını doğrulaması',
    },
    'Валидирање од службата за студентски прашања': {
      en: 'Validation by Student Services',
      sq: 'Verifikimi nga shërbimi studentor',
      tr: 'Öğrenci işlerinin doğrulaması',
    },
    'Валидирање од студентска служба': {
      en: 'Validation by Student Services',
      sq: 'Verifikimi nga shërbimi studentor',
      tr: 'Öğrenci işlerinin doğrulaması',
    },
    'Забелешки од комисија': {
      en: 'Committee comments',
      sq: 'Vërejtjet e komisionit',
      tr: 'Komisyon yorumları',
    },
    'Закажување на одбрана од менторот': {
      en: 'Defense scheduling by the mentor',
      sq: 'Caktimi i mbrojtjes nga mentori',
      tr: 'Danışmanın savunmayı planlaması',
    },
    Одбран: { en: 'Defended', sq: 'I mbrojtur', tr: 'Savunuldu' },
    Одбрана: { en: 'Defense', sq: 'Mbrojtja', tr: 'Savunma' },
    'Одобрение за оценка од ментор': {
      en: 'Approval for grading by the mentor',
      sq: 'Miratimi për vlerësim nga mentori',
      tr: 'Danışmanın değerlendirme onayı',
    },
    'Одобрение на оценка од членовите на комисијата': {
      en: 'Grade approval by committee members',
      sq: 'Miratimi i notës nga anëtarët e komisionit',
      tr: 'Komisyon üyelerinin notu onaylaması',
    },
    'Одобрение на текст од менторот': {
      en: 'Thesis text approval by the mentor',
      sq: 'Miratimi i tekstit të punimit nga mentori',
      tr: 'Danışmanın tez metnini onaylaması',
    },
    'Одобрение на текст од членовите на комисијата': {
      en: 'Thesis text approval by committee members',
      sq: 'Miratimi i tekstit të punimit nga anëtarët e komisionit',
      tr: 'Komisyon üyelerinin tez metnini onaylaması',
    },
    'Одобрение од продекан за настава': {
      en: 'Approval by the Vice Dean for Teaching',
      sq: 'Miratimi nga prodekani për mësim',
      tr: 'Eğitimden sorumlu dekan yardımcısının onayı',
    },
    'Откажано од менторот': {
      en: 'Cancelled by the mentor',
      sq: 'Anuluar nga mentori',
      tr: 'Danışman tarafından iptal edildi',
    },
    'Очекување на оценa од менторот': {
      en: 'Awaiting a grade from the mentor',
      sq: 'Në pritje të notës nga mentori',
      tr: 'Danışmanın not vermesi bekleniyor',
    },
    'Очекување на текст од менторот': {
      en: 'Awaiting the thesis text from the mentor',
      sq: 'Në pritje të tekstit të punimit nga mentori',
      tr: 'Danışmanın tez metni bekleniyor',
    },
    Пријава: { en: 'Application', sq: 'Aplikimi', tr: 'Başvuru' },
    'Прифаќање на тема од студентот': {
      en: 'Topic acceptance by the student',
      sq: 'Pranimi i temës nga studenti',
      tr: 'Öğrencinin tez konusunu kabul etmesi',
    },
    'Прифаќање на темата од студентот': {
      en: 'Topic acceptance by the student',
      sq: 'Pranimi i temës nga studenti',
      tr: 'Öğrencinin tez konusunu kabul etmesi',
    },
    'Регистрирање на тема од професорот': {
      en: 'Topic registration by the professor',
      sq: 'Regjistrimi i temës nga profesori',
      tr: 'Öğretim üyesinin tez konusunu kaydetmesi',
    },
  },
  masters: {
    '1. Студентот пополнува и прикачува документи за пријава.': {
      en: '1. The student completes and uploads the application documents.',
      sq: '1. Studenti plotëson dhe ngarkon dokumentet e aplikimit.',
      tr: '1. Öğrenci başvuru belgelerini doldurur ve yükler.',
    },
    '2. Менторот ги проверува и валидира документите за пријава.': {
      en: '2. The mentor checks and validates the application documents.',
      sq: '2. Mentori kontrollon dhe verifikon dokumentet e aplikimit.',
      tr: '2. Danışman başvuru belgelerini kontrol eder ve doğrular.',
    },
    '3. Студентска служба проверува и валидира пријава.': {
      en: '3. Student Services checks and validates the application.',
      sq: '3. Shërbimi studentor kontrollon dhe verifikon aplikimin.',
      tr: '3. Öğrenci işleri başvuruyu kontrol eder ve doğrular.',
    },
    '4. Наставно научна комисија валидира пријава.': {
      en: '4. The Teaching and Scientific Commission validates the application.',
      sq: '4. Komisioni Mësimor-Shkencor verifikon aplikimin.',
      tr: '4. Öğretim ve Bilim Komisyonu başvuruyu doğrular.',
    },
    '5. Архивирање на материјали за пријава.': {
      en: '5. Archiving the application materials.',
      sq: '5. Arkivimi i materialeve të aplikimit.',
      tr: '5. Başvuru belgelerinin arşivlenmesi.',
    },
    '6. Додавање точка за ННС за пријава.': {
      en: '6. Adding the application to the Teaching and Scientific Council (NNS) agenda.',
      sq: '6. Shtimi i aplikimit në rendin e ditës të Këshillit Mësimor-Shkencor (NNS).',
      tr: '6. Başvurunun Öğretim ve Bilim Kurulu (NNS) gündemine eklenmesi.',
    },
    '7. Генерирање и архивирање одлука од ННС за пријава.': {
      en: '7. Generating and archiving the Teaching and Scientific Council (NNS) decision on the application.',
      sq: '7. Përgatitja dhe arkivimi i vendimit të Këshillit Mësimor-Shkencor (NNS) për aplikimin.',
      tr: '7. Öğretim ve Bilim Kurulunun (NNS) başvuru kararının hazırlanması ve arşivlenmesi.',
    },
    '8. Испраќање на пријава до УКИМ.': {
      en: '8. Sending the application to UKIM.',
      sq: '8. Dërgimi i aplikimit në UKIM.',
      tr: '8. Başvurunun UKIM’e gönderilmesi.',
    },
    '9. Студентот подготвува и менторот прикачува работна верзија од трудот.': {
      en: '9. The student prepares a draft of the thesis and the mentor uploads it.',
      sq: '9. Studenti përgatit një draft të punimit dhe mentori e ngarkon.',
      tr: '9. Öğrenci tez taslağını hazırlar ve danışman yükler.',
    },
    '10. Менторот предлага членови на комисија.': {
      en: '10. The mentor proposes committee members.',
      sq: '10. Mentori propozon anëtarët e komisionit.',
      tr: '10. Danışman komisyon üyelerini önerir.',
    },
    '11. Забелешки за комисијата од ННК, професорите оставаат коментари и координатор валидира.':
      {
        en: '11. The Teaching and Scientific Commission (NNK) reviews the committee, professors comment, and the coordinator validates.',
        sq: '11. Komisioni Mësimor-Shkencor (NNK) shqyrton komisionin, profesorët komentojnë dhe koordinatori verifikon.',
        tr: '11. Öğretim ve Bilim Komisyonu (NNK) komisyon önerisini inceler, öğretim üyeleri yorum yapar ve koordinatör doğrular.',
      },
    '12. Архивирање на материјали за предлог на комисија.': {
      en: '12. Archiving the proposed committee materials.',
      sq: '12. Arkivimi i materialeve për propozimin e komisionit.',
      tr: '12. Komisyon önerisine ilişkin belgelerin arşivlenmesi.',
    },
    '13. Додавање точка за ННС за предлог на комисија.': {
      en: '13. Adding the proposed committee to the Teaching and Scientific Council (NNS) agenda.',
      sq: '13. Shtimi i propozimit për komisionin në rendin e ditës të Këshillit Mësimor-Shkencor (NNS).',
      tr: '13. Komisyon önerisinin Öğretim ve Bilim Kurulu (NNS) gündemine eklenmesi.',
    },
    '14. Генерирање и архивирање одлука од ННС за предлог на комисија.': {
      en: '14. Generating and archiving the Teaching and Scientific Council (NNS) decision on the proposed committee.',
      sq: '14. Përgatitja dhe arkivimi i vendimit të Këshillit Mësimor-Shkencor (NNS) për propozimin e komisionit.',
      tr: '14. Öğretim ve Bilim Kurulunun (NNS) komisyon önerisine ilişkin kararının hazırlanması ve arşivlenmesi.',
    },
    '15. Испраќање на предлог на комисија до УКИМ.': {
      en: '15. Sending the proposed committee to UKIM.',
      sq: '15. Dërgimi i propozimit për komisionin në UKIM.',
      tr: '15. Komisyon önerisinin UKIM’e gönderilmesi.',
    },
    '16. Комисија проверува и остава коментари, студентот корегира, менторот прикачува нов драфт документ.':
      {
        en: '16. The committee reviews and comments, the student makes corrections, and the mentor uploads a new draft.',
        sq: '16. Komisioni shqyrton dhe komenton, studenti bën korrigjimet dhe mentori ngarkon një draft të ri.',
        tr: '16. Komisyon inceler ve yorum yapar, öğrenci düzeltmeleri yapar ve danışman yeni taslağı yükler.',
      },
    '17. Менторот прикачува извештај, членови на комисијата оставаат коментари.':
      {
        en: '17. The mentor uploads the report and committee members leave comments.',
        sq: '17. Mentori ngarkon raportin dhe anëtarët e komisionit lënë komente.',
        tr: '17. Danışman raporu yükler ve komisyon üyeleri yorumlarını ekler.',
      },
    '18. Архивирање на материјали за извештај.': {
      en: '18. Archiving the report materials.',
      sq: '18. Arkivimi i materialeve të raportit.',
      tr: '18. Rapor belgelerinin arşivlenmesi.',
    },
    '19. Додавање точка за ННС за извештај.': {
      en: '19. Adding the report to the Teaching and Scientific Council (NNS) agenda.',
      sq: '19. Shtimi i raportit në rendin e ditës të Këshillit Mësimor-Shkencor (NNS).',
      tr: '19. Raporun Öğretim ve Bilim Kurulu (NNS) gündemine eklenmesi.',
    },
    '20. Генерирање и архивирање одлука од ННС за извештај.': {
      en: '20. Generating and archiving the Teaching and Scientific Council (NNS) decision on the report.',
      sq: '20. Përgatitja dhe arkivimi i vendimit të Këshillit Mësimor-Shkencor (NNS) për raportin.',
      tr: '20. Öğretim ve Bilim Kurulunun (NNS) rapor kararının hazırlanması ve arşivlenmesi.',
    },
    '21. Испраќање на извештај на магистерска до УКИМ.': {
      en: '21. Sending the thesis report to UKIM.',
      sq: '21. Dërgimi i raportit të punimit në UKIM.',
      tr: '21. Tez raporunun UKIM’e gönderilmesi.',
    },
    '22. Менторот ја закажува одбраната (внесува датум и просторија на одбрана).':
      {
        en: '22. The mentor schedules the defense (enters its date and room).',
        sq: '22. Mentori cakton mbrojtjen (shënon datën dhe sallën e mbrojtjes).',
        tr: '22. Danışman savunmayı planlar (savunma tarihini ve salonunu girer).',
      },
    '23. Студентска служба архивира и валидира.': {
      en: '23. Student Services archives and validates the thesis.',
      sq: '23. Shërbimi studentor arkivon dhe verifikon punimin.',
      tr: '23. Öğrenci işleri tezi arşivler ve doğrular.',
    },
    '24. Магистерската е завршена.': {
      en: '24. The master’s thesis is complete.',
      sq: '24. Punimi i masterit ka përfunduar.',
      tr: '24. Yüksek lisans tezi tamamlandı.',
    },
    Коментар: { en: 'Comment', sq: 'Koment', tr: 'Yorum' },
    'Магистерската е откажана.': {
      en: 'The master’s thesis has been cancelled.',
      sq: 'Punimi i masterit është anuluar.',
      tr: 'Yüksek lisans tezi iptal edildi.',
    },
    'Направена измена': {
      en: 'An edit was made',
      sq: 'Është bërë një ndryshim',
      tr: 'Değişiklik yapıldı',
    },
    'Направена измена на статус': {
      en: 'The status was changed',
      sq: 'Statusi është ndryshuar',
      tr: 'Durum değiştirildi',
    },
    'Секретар валидира. (статусот не се користи)': {
      en: 'Secretary validation (unused status).',
      sq: 'Verifikimi nga sekretari (status që nuk përdoret).',
      tr: 'Sekreter doğrulaması (kullanılmayan durum).',
    },
    'Секретар додава архивски број и валидира. (статусот не се користи)': {
      en: 'The secretary adds an archive number and validates (unused status).',
      sq: 'Sekretari shton numrin e arkivit dhe verifikon (status që nuk përdoret).',
      tr: 'Sekreter arşiv numarasını ekler ve doğrular (kullanılmayan durum).',
    },
    'Секретарот го валидира изборот на комисија. (статусот не се користи)': {
      en: 'The secretary validates the committee selection (unused status).',
      sq: 'Sekretari verifikon përzgjedhjen e komisionit (status që nuk përdoret).',
      tr: 'Sekreter komisyon seçimini doğrular (kullanılmayan durum).',
    },
  },
};
