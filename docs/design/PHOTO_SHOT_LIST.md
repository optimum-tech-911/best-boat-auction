# Photo shot list

Four demonstration lots still borrow a homepage category picture, so the same image appears twice on the site. Each needs its own three photographs.

| Lot | Folder to create in `bestboatauction boats/` | The boat |
| --- | --- | --- |
| 7705 Rivage 42 Fly | `rivage-42-fly/` | 13 m flybridge motor yacht, 2007, white, two double cabins. Moored at Hellevoetsluis (North Sea, Netherlands): grey-blue northern light, Dutch marina. |
| 7708 Lago 750 | `lago-750/` | 7.50 m classic-style lake runabout, 2016, mahogany-look deck, cream upholstery. On the Traunsee at Gmunden (Austria): lake and mountains. |
| 7603 Belvaro 9 | `belvaro-9/` | 9 m sports day cruiser, 2014, white with a small cabin. Lac du Bourget at Aix-les-Bains (France): lake and mountains, different from Lago 750. |
| 7608 Ostrea 44 | `ostrea-44/` | 13.50 m flybridge motor yacht, 2005, with a look different from Rivage 42 Fly (for example a dark hull). In the marina at Imperia (Liguria, Italy): Mediterranean light. |

## In each folder

- `01-cover`: the whole boat, three-quarter front view, on the water or alongside.
- `02-angle`: a second exterior view (flybridge, cockpit or rear three-quarter).
- `03-detail`: the interior or the helm.

Landscape, at least 2000 px wide, JPG, PNG or WebP. No legible brand names, registration numbers or recognisable faces.

## Then

```sh
pnpm import:lot-photos
```

The script converts the photographs, records them in `assets/lot-photos.json` and updates the demonstration gallery. The four lots switch to their own photos automatically; the alternative texts already describe the shots above.
