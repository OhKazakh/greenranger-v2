import streamlit as st

LANGUAGES = {"ru": "РУ", "en": "EN", "kk": "ҚАЗ"}

MATERIALS = {
    "plastic": {"ru": "Пластик", "en": "Plastic", "kk": "Пластик", "icon": "recycling"},
    "paper": {"ru": "Бумага", "en": "Paper", "kk": "Қағаз", "icon": "description"},
    "glass": {"ru": "Стекло", "en": "Glass", "kk": "Шыны", "icon": "wine_bar"},
    "metal": {"ru": "Металл", "en": "Metal", "kk": "Металл", "icon": "construction"},
    "aluminium": {"ru": "Алюминий", "en": "Aluminium", "kk": "Алюминий", "icon": "local_drink"},
    "bottles": {"ru": "Бутылки", "en": "Bottles", "kk": "Бөтелкелер", "icon": "water_bottle"},
    "clothes": {"ru": "Одежда", "en": "Clothes", "kk": "Киім", "icon": "checkroom"},
    "electronics": {"ru": "Электроника", "en": "Electronics", "kk": "Электроника", "icon": "smartphone"},
    "batteries": {"ru": "Батарейки", "en": "Batteries", "kk": "Батареялар", "icon": "battery_full"},
    "industrial": {"ru": "Пром. отходы", "en": "Industrial", "kk": "Өнеркәсіп қалдықтары", "icon": "factory"},
}

TEXT = {
    "ru": {
        "page": "Найти пункт",
        "title": "Ближайшие пункты",
        "hint": "Найдите адрес или нажмите на карту, чтобы увидеть три ближайших пункта с учётом фильтров.",
        "address_placeholder": "Адрес, например Кабанбай батыра 62",
        "search": "Найти",
        "attribution": "Поиск адресов © OpenStreetMap",
        "not_found": "Адрес в Астане не найден",
        "search_failed": "Поиск адреса сейчас недоступен",
        "type": "Тип",
        "type_all": "Все пункты",
        "type_hub": "Крупные центры",
        "type_kiosk": "Киоски",
        "materials": "Фильтр по материалу",
        "no_results": "По выбранным фильтрам пунктов не найдено",
        "clear": "Очистить",
        "directions": "Маршрут",
        "status_open": "Открыто",
        "status_closed": "Закрыто",
        "status_unknown": "Часы неизвестны",
        "you_are_here": "Вы здесь",
        "points": "{count} пунктов",
        "loading": "Загружаем пункты…",
        "snapshot": "Сайт недоступен, показана сохранённая копия данных.",
        "retry": "Повторить",
        "site": "Открыть сайт",
        "m": "м",
        "km": "км",
    },
    "en": {
        "page": "Find a point",
        "title": "Nearest points",
        "hint": "Search an address or click the map to see the three closest points that match your filters.",
        "address_placeholder": "Address, e.g. Kabanbay Batyr 62",
        "search": "Search",
        "attribution": "Address search © OpenStreetMap",
        "not_found": "Couldn't find that address in Astana",
        "search_failed": "Address search is unavailable right now",
        "type": "Type",
        "type_all": "All points",
        "type_hub": "Large centres",
        "type_kiosk": "Kiosks",
        "materials": "Filter by material",
        "no_results": "No points found for the selected filters",
        "clear": "Clear",
        "directions": "Directions",
        "status_open": "Open now",
        "status_closed": "Closed now",
        "status_unknown": "Hours unknown",
        "you_are_here": "You are here",
        "points": "{count} points",
        "loading": "Loading points…",
        "snapshot": "The site is unreachable, showing a saved copy of the data.",
        "retry": "Retry",
        "site": "Open the site",
        "m": "m",
        "km": "km",
    },
    "kk": {
        "page": "Пункт табу",
        "title": "Ең жақын пункттер",
        "hint": "Сүзгілерге сәйкес ең жақын үш пунктті көру үшін мекенжайды іздеңіз немесе картаны басыңыз.",
        "address_placeholder": "Мекенжай, мысалы Қабанбай батыр 62",
        "search": "Іздеу",
        "attribution": "Мекенжай іздеу © OpenStreetMap",
        "not_found": "Астанадан мұндай мекенжай табылмады",
        "search_failed": "Мекенжай іздеу қазір қолжетімсіз",
        "type": "Түрі",
        "type_all": "Барлық нүктелер",
        "type_hub": "Ірі орталықтар",
        "type_kiosk": "Киосктар",
        "materials": "Материал бойынша сүзу",
        "no_results": "Таңдалған сүзгілер бойынша нүктелер табылмады",
        "clear": "Тазалау",
        "directions": "Бағыт",
        "status_open": "Қазір ашық",
        "status_closed": "Қазір жабық",
        "status_unknown": "Жұмыс уақыты белгісіз",
        "you_are_here": "Сіз осындасыз",
        "points": "{count} нүкте",
        "loading": "Пункттер жүктелуде…",
        "snapshot": "Сайт қолжетімсіз, деректердің сақталған көшірмесі көрсетілді.",
        "retry": "Қайталау",
        "site": "Сайтты ашу",
        "m": "м",
        "km": "км",
    },
}


def current_language():
    return st.session_state.get("lang") or "ru"


def t(key, **values):
    return TEXT[current_language()][key].format(**values)


def material_label(code):
    material = MATERIALS[code]
    return f":material/{material['icon']}: {material[current_language()]}"


def format_distance(km):
    if km < 1:
        return f"{round(km * 1000)} {t('m')}"
    return f"{km:.1f} {t('km')}"
