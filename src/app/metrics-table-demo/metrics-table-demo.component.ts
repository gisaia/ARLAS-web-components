import { Component, OnInit } from '@angular/core';
import { MetricsTable } from "../../../projects/arlas-components/src/lib/components/metrics-table/model/metrics-table";
@Component({
  selector: 'arlas-multi-bar-demo',
  templateUrl: './metrics-table-demo.component.html',
  styleUrls: ['./metrics-table-demo.component.css'],
})
export class MetricsTableDemoComponent implements OnInit {
  public multiBarTableSameTitle: MetricsTable = {
    header: [
      {title: 'produit de la casa par tu', subTitle: ' couverture nuageuse', metric: 'avg'},
      {title: 'produit de la casa par tu', subTitle: ' couverture', metric: 'min'},
      {title: 'produit de la casa par tu', subTitle: ' couverture', metric: 'min'},
      {title: 'produit de la casa par tu', subTitle: ' couverture', metric: 'min'},
    ],
    data: [
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: 0, maxValue: 1000},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 0, maxValue: 1000}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
    ]
  };

  public multiBarTDiffTittle: MetricsTable = {
    header: [
      {title: 'produit', subTitle: 'couverture nuageuse sssssssssssssssssssssssssssssssssssssssssssssssssssssssss ', metric: 'avg'},
      {title: 'satellite', subTitle: ' couverture nuageuse', metric: 'min'},
      {title: 'produit', subTitle: ' couverture not min', metric: 'min'},
      {title: 'cost', subTitle: ' couverture', metric: 'min'},
    ],
    data: [
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: null, maxValue: 0},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: null, maxValue: 0}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
    ]
  };

  public multiBarTAllDiffTittle: MetricsTable = {
    header: [
      {title: 'produit', subTitle: 'couverture nuageuse sssssssssssssssssssssssssssssssssssssssssssssssssssssssss ', metric: 'avg'},
      {title: 'satellite', subTitle: ' couverture nuageuse', metric: 'min'},
      {title: 'course', subTitle: ' couverture not min', metric: 'min'},
      {title: 'cost', subTitle: ' couverture', metric: 'min'},
    ],
    data: [
      {
        term: 'pneo', data: [
          {value: 800, maxValue: 1000},
          {value: null, maxValue: 0},
          {value: 500, maxValue: 1000}, {
            value: 500,
            maxValue: 1000
          }]
      },
      {
        term: 'dede', data: [
          {value: 600, maxValue: 1000},
          {value: 300, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: 500, maxValue: 1000
          }
        ]
      },
      {
        term: 'toto', data: [
          {value: 600, maxValue: 1000},
          {value: 500, maxValue: 1000},
          {value: null, maxValue: 0}, {value: 500, maxValue: 1000}]
      },
      {
        term: 'titi', data: [
          {value: 600, maxValue: 1000},
          {value: 550, maxValue: 1000},
          {value: 1000, maxValue: 1000},
          {value: 500, maxValue: 1000}]
      },
      {
        term: 'deto', data: [
          {value: 750, maxValue: 1000},
          {value: 40, maxValue: 1000},
          {value: 230, maxValue: 1000},
          {value: 500, maxValue: 1000}
        ]
      },
    ]
  };
  constructor() { }

  ngOnInit(): void {
  }

}
