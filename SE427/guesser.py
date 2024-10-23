import statistics

takimlar = {}

toplam_puan = 10

def takim_puanlarini_gir(takim_adi):
    puanlar = {}
    
    while True:
        hedef_takim = input(f"{takim_adi}. takım hangi takıma puan verecek? (1-10 arası takım numarası, eğer bitirdiyse 'e' tuşuna basın, q tuşuna basarak tahmin yapabilirsiniz): ")
        
        if hedef_takim == 'e':
            break
        elif hedef_takim == 'q':
            tahmin_yap()
            continue
        elif int(hedef_takim) == takim_adi:
            print("Kendine puan veremezsin, başka bir takım seç!")
            continue
        
        try:
            hedef_takim = int(hedef_takim)
            if hedef_takim < 1 or hedef_takim > 10:
                print("Lütfen 1-10 arası bir takım numarası gir.")
                continue
        except ValueError:
            print("Geçerli bir takım numarası giriniz.")
            continue
        
        puan = input(f"{takim_adi}. takım {hedef_takim}. takıma kaç puan veriyor? ")
        
        try:
            puan = int(puan)
            if puan < 0:
                print("Negatif puan veremezsin, tekrar dene!")
                continue
            puanlar[hedef_takim] = puan
        except ValueError:
            print("Geçerli bir puan giriniz.")
    
    return puanlar

def tahmini_puanlama(takimlar, tahmin_edilecek_takim, toplam_puan):
    puanlar = {}

    genel_puanlar = {i: [] for i in range(1, 11)}
    
    for takim, hedefler in takimlar.items():
        for hedef_takim, puan in hedefler.items():
            genel_puanlar[hedef_takim].append(puan)
    
    tahminler = {}
    for takim, puan_listesi in genel_puanlar.items():
        if takim != tahmin_edilecek_takim and puan_listesi:
            ortalama = statistics.mean(puan_listesi)
            medyan = statistics.median(puan_listesi)
            tahminler[takim] = (ortalama + medyan) / 2
    
    toplam_tahmini_puan = sum(tahminler.values())
    tahmin_edilen_puanlar = {}
    for takim, tahmini_deger in tahminler.items():
        oran = tahmini_deger / toplam_tahmini_puan
        tahmin_edilen_puanlar[takim] = round(oran * toplam_puan, 2)
    
    return tahmin_edilen_puanlar

def tahmin_yap():
    while True:
        tahmin_takimi = input("Hangi takımın puan dağıtımını tahmin etmek istersiniz? (1-10, çıkmak için 'q'): ")
        if tahmin_takimi == 'q':
            break
        try:
            tahmin_takimi = int(tahmin_takimi)
            if tahmin_takimi < 1 or tahmin_takimi > 10:
                print("Lütfen 1-10 arası geçerli bir takım numarası giriniz.")
            else:
                sonuc = tahmini_puanlama(takimlar, tahmin_takimi, toplam_puan)
                print(f"\n{tahmin_takimi}. takımın diğer takımlara vereceği tahmini puanlar:")
                for takim, puan in sonuc.items():
                    print(f"Takım {takim}: {puan} puan")
                break
        except ValueError:
            print("Geçerli bir sayı giriniz.")

print("Takımlar puanlama yapacak. Kendine puan verilemez. Puanlama yaparken herhangi bir anda 'q' tuşuna basarak tahmin alabilirsiniz.")

while True:
    takim_adi = input("\nHangi takım puan verecek? (1-10 arası takım numarası, q tuşuna basarak tahmin yapabilirsiniz): ")
    if takim_adi == 'q':
        tahmin_yap()
        continue

    try:
        takim_adi = int(takim_adi)
        if takim_adi < 1 or takim_adi > 10:
            print("Lütfen 1-10 arası geçerli bir takım numarası giriniz.")
            continue
    except ValueError:
        print("Geçerli bir takım numarası giriniz.")
        continue
    
    print(f"\n{takim_adi}. takımın puanlaması:")
    takimlar[takim_adi] = takim_puanlarini_gir(takim_adi)
