from argparse import ArgumentParser
from csv import reader
from re import compile

from pymongo import MongoClient

CSV_KEYS = [
    'id', 'name', 'type_short', 'type', 'legal', 'authority_short',
    'authority', 'supervisor_short', 'supervisor', 'street', 'zipcode',
    'city', 'municipality', 'municipality_id', 'phone', 'fax', 'url',
    'email', 'form_offerings', 'special_facilities'
]


def insert_school_list(
    mongodb_url: str,
    csv_path: str,
    keys: list[str],
    filter: str = r'[\d]{4,}',
    csv_delimiter: str = ';'
) -> None:
    with MongoClient(mongodb_url) as mongodb:
        collection = mongodb.get_default_database().get_collection('schools')

        with open(csv_path, mode='r', encoding='utf-8') as csv_file:
            csv_data = reader(csv_file, delimiter=csv_delimiter)
            regex = compile(filter)

            collection.insert_many([
                dict(zip(keys, entry)) for entry in csv_data if regex.match(entry[0])
            ])


if __name__ == '__main__':
    parser = ArgumentParser(description='Import school data from CSV file into MongoDB')
    parser.add_argument('--mongodb', type=str, default='mongodb://localhost:27017/', help='MongoDB connection URL')
    parser.add_argument('--csv', type=str, default='./data.csv', help='Path to CSV file')
    parser.add_argument('--keys', type=str, default=CSV_KEYS, help='List of keys to use for CSV entries')
    parser.add_argument('--filter', type=str, default=r'[\d]{4,}', help='Regex filter for CSV entries')
    parser.add_argument('--csv-delimiter', type=str, default=';', help='Delimiter for CSV entries')
    args = parser.parse_args()

    insert_school_list(args.mongodb, args.csv, args.keys, args.filter, args.csv_delimiter)
    print('Done')
