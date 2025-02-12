import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  headerConstants,
  ratingConstants,
} from 'src/app2/shared/constants/constant';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import * as $ from 'jquery';
import { finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

@Component({
  selector: 'app-rating-definition',
  templateUrl: './rating-definition.component.html',
  styleUrls: ['./rating-definition.component.css'],
})
export class RatingDefinitionComponent implements OnInit, OnDestroy {
  headerConstants = headerConstants;
  loading_rating_schemes;
  filterRatingScheme = '';
  rating_types = [];
  selectedType;
  loading_categories;
  ratingDef;
  selectedCategory;
  ratingConstants = ratingConstants;
  precision;
  negativePrecision;
  selectedSubCategory;
  ratingList: any;
  updating_rating_type: boolean;
  ratingSchemeSub;
  ratingSub;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly routerService: RouterService,
    private readonly NewModalFactory: CustomModalService,
    private readonly RatingService: RatingService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.setPanelHeadingControls();
    this.RatingService.getAllRatingScales(() => {});
    this.ratingSchemeSub = this.RatingService.ratingSchemeSub.subscribe(
      ({ category, isSubCategory, isRatings }) => {
        if (isRatings) {
          this.putToRatingList(category);
          this.getRatings(this.selectedSubCategory);
          this.validateCategoryWeightages(this.ratingDef.categories);
          this.validateSubCategoryWeightages(this.ratingDef.subcategories);
        } else if (isSubCategory) {
          this.putToRatingList(category);
          this.getSubcategories(this.selectedCategory);
          this.validateCategoryWeightages(this.ratingDef.categories);
        } else {
          this.putToRatingList(category);
          this.getCategories();
        }
      }
    );

    this.ratingDef = {
      categories: [],
      subcategories: [],
      ratings: [],
    };
    this.precision = 0.04000000000000625;
    this.negativePrecision = this.precision * -1;
    this.loading_rating_schemes = true;
    this.RatingService.getAllRatingType(
      (response) => {
        this.loading_rating_schemes = false;
        this.rating_types = response;
        let selectedIndex = 0;
        const params = this.routerService
          .getState()
          .params?.rating_id?.split('_');
        const rating_id = params?.length ? params[0] : null;
        const scrollToCustomFields =
          params?.length > 1 ? params[1] === 'scrollToCustomFields' : false;
        if (rating_id) {
          selectedIndex = this.rating_types.findIndex(
            (rating) => rating.id === parseInt(rating_id)
          );
          if (selectedIndex > -1) {
            if (!scrollToCustomFields)
              setTimeout(() => {
              const ratingElementId = `#rating_scheme_${rating_id}`;
              const element = $(
                `.rating-scroll-view ul #rating_scheme_${rating_id}`
              );
              return $('.rating-scroll-view').animate(
                {
                  scrollTop: element.offset().top - 200,
                },
                500
              );
            }, 100);
          } else {
            selectedIndex = 0;
          }
        }
        this.selectRatingType(this.rating_types[selectedIndex]);
        if (scrollToCustomFields) {
          setTimeout(() => {
            const element = document.getElementById(`customFieldElement`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, 2000);
        }
      },
      () => {
        this.loading_rating_schemes = false;
      }
    );
    this.ratingSub = this.RatingService.ratingSub.subscribe(
      ({ rating, edit }) => {
        this.rating_types = rating;
        if (!edit)
          this.selectRatingType(
            this.rating_types[this.rating_types.length - 1]
          );
      }
    );
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'Add New',
        handleClick: this.onAddRatingClick.bind(this),
        tooltip: 'Add New Rating/Score Definition',
        leftIcon: 'plus',
      },
    ];
  }


  fetchRatingSubTypes(rating_type) {
    this.loading_categories = true;
    //load the rating list and extract category, subcategory and ratings from it.
    this.RatingService.getRatingSubTypes(
      rating_type.id,
      rating_type.version,
      (response) => {
        this.ratingList = response;
        this.getCategories();
        this.loading_categories = false;
      },
      () => {
        this.loading_categories = false;
      }
    );
  }

  getCategories() {
    //extract the categories from the rating list
    this.ratingDef.categories = this.generateRatingMap(
      this.ratingList,
      null,
      1
    );
    //select the first item and get subcategories of that item.
    this.getSubcategories(this.ratingDef.categories[0]);
    this.validateCategoryWeightages(this.ratingDef.categories);
  }

  generateRatingMap(ratings: any, parentID: any, category_level: number) {
    return ratings.filter(
      (category) =>
        category.category_level === category_level &&
        category.parent_id === parentID
    );
  }

  validateCategoryWeightages(categories: any) {
    categories.forEach((category) => {
      if (category.is_active) {
        let ratings = [];
        //get the subcategories under this category
        const subcategories = this.generateRatingMap(
          this.ratingList,
          category.id,
          2
        );
        //calculate the total weightages of these subcategories
        const subcategoryTotalWeightage =
          this.getChildWeightages(subcategories);
        //get the subcategory difference
        const subcategoryDifference =
          subcategoryTotalWeightage - category.weightage;
        //compare the differences and set the exceeding value appropriately
        if (subcategoryDifference > this.precision) {
          category.exceeding_weight = subcategoryDifference;
        } else if (subcategoryDifference < this.negativePrecision) {
          category.exceeding_weight = subcategoryDifference;
        } else {
          //if subcategories weightages doesnt exceed or deceed the category weightage then verify the rating weightages.
          //get the ratings inside all these subcategories
          subcategories.forEach((subcategory) => {
            ratings = ratings.concat(
              this.generateRatingMap(this.ratingList, subcategory.id, 3)
            );
          });
          //get the total weightage of these ratings
          const ratingTotalWeightage = this.getChildWeightages(ratings);
          //get the rating difference
          const ratingDifference = ratingTotalWeightage - category.weightage;
          if (ratingDifference > this.precision) {
            category.exceeding_weight = ratingDifference;
          } else if (ratingDifference < this.negativePrecision) {
            category.exceeding_weight = ratingDifference;
          } else {
            //if it is not exceeding then set the exceeding_weight to 0
            category.exceeding_weight = 0;
          }
        }
      }
    });
  }

  getChildWeightages(children) {
    //method to calculate the weightages
    return children.reduce((sum: number, category) => {
      if (category.is_active) {
        return sum + category.weightage;
      } else {
        return sum + 0;
      }
    }, 0);
  }

  selectRatingType(type) {
    if (type.id) {
      this.resetRating();
      this.selectedType = type;
      this.fetchRatingSubTypes(this.selectedType);
    }
  }

  resetRating() {
    this.ratingDef = {
      categories: [],
      subcategories: [],
      ratings: [],
    };
    this.selectedCategory = null;
    this.selectedSubCategory = null;
  }

  onAddRatingClick() {
    const allRatingsName = this.rating_types.map((val) => val.name);
    this.NewModalFactory.invoke('add-rating-scheme', {
      initialState: {
        allRatings: allRatingsName,
        onSuccess: (_) => {
          setTimeout(() => {
            const element = document.getElementById(
              `rating_scheme_${this.selectedType.id}`
            );
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, 500);
        },
      },
    });
  }

  onEditRatingType(type) {
    if (!type.is_system) {
      const editingRatingType = { ...type };
      const allRatingsName = this.rating_types.map((val) => val.name);
      this.NewModalFactory.invoke('add-rating-scheme', {
        initialState: {
          allRatings: allRatingsName,
          ratingObject: editingRatingType,
        },
      });
    }
  }

  removeRating(type, resolve) {
    if (!type.is_system) {
      this.http
        .delete(`rating_types/${type.id}`)
        .pipe(
          finalize(() => {
            this.updating_rating_type = false;
            resolve();
          })
        )
        .subscribe(
          (response: any) => {
            this.toaster.success(
              'Your rating type has been deleted successfully'
            );
            const index = this.rating_types.indexOf(type);
            this.rating_types.splice(index, 1);
            if (
              type.id === this.selectedType.id &&
              this.rating_types.length > 0
            ) {
              this.selectRatingType(this.rating_types[0]);
            } else if (this.rating_types.length === 0) {
              this.selectedType = null;
              this.resetRating();
            }
          },
          () => {}
        );
    }
  }

  getSubcategories(parent: any) {
    if (parent !== undefined && parent !== null) {
      this.selectedCategory = { ...parent };
      //extract subcategories from the rating list whose parent is the selected category
      this.ratingDef.subcategories = this.generateRatingMap(
        this.ratingList,
        this.selectedCategory.id,
        2
      );
      //select the first item and get ratings of that item
      this.getRatings(this.ratingDef.subcategories[0]);
      this.validateSubCategoryWeightages(this.ratingDef.subcategories);
    } else {
      this.ratingDef.subcategories = [];
      this.selectedCategory = null;
    }
  }

  validateSubCategoryWeightages(subcategories: any) {
    subcategories.forEach((subcategory) => {
      if (subcategory.is_active) {
        //get the ratings under the subcategories
        const ratings = this.generateRatingMap(
          this.ratingList,
          subcategory.id,
          3
        );
        //get total rating weightage
        const ratingTotalWeightage = this.getChildWeightages(ratings);
        //get the difference
        const ratingDifference = ratingTotalWeightage - subcategory.weightage;
        //compare the difference and set the exceeding value
        if (ratingDifference > this.precision) {
          subcategory.exceeding_weight = ratingDifference;
        } else if (ratingDifference < this.negativePrecision) {
          subcategory.exceeding_weight = ratingDifference;
        } else {
          //otherwise set the exceeding_weight to 0
          subcategory.exceeding_weight = 0;
        }
      }
    });
  }

  getRatings(parent: any) {
    if (parent !== undefined && parent !== null) {
      this.selectedSubCategory = { ...parent };
      //extract ratings from the rating list whose parent is the selected subcategory
      this.ratingDef.ratings = this.generateRatingMap(
        this.ratingList,
        this.selectedSubCategory.id,
        3
      );
    } else {
      this.ratingDef.ratings = [];
      this.selectedSubCategory = null;
    }
  }

  putToRatingList(list: any) {
    //iterate the list and remove the deleted items from the ratingList, modify the existing items and
    //add new items
    list.forEach((item) => {
      const index = this.ratingList.findIndex(
        (rating) => item.id === rating.id
      );
      if (item.is_active) {
        this.ratingList[index] = { ...item };
      } else {
        this.ratingList.splice(index, 1);
      }
      if (index < 0) {
        this.ratingList.push({ ...item });
      }
    });
  }

  confirmRatingDeletion(type) {
    if (!type.is_system) {
      this.SweetAlert.confirm({
        title: 'Are you sure you want to remove this rating?',
        text: type.has_scorerules
          ? 'Rules associated with this rating will also be deleted'
          : null,
        focusCancel: true,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          return new Promise<void>((resolve) => {
            this.removeRating(type, resolve);
          });
        },
      }).then(() => {
        // swal.close();
      });
    }
  }

  openAddCategoryModal() {
    if (this.selectedType && !this.selectedType.is_system) {
      this.NewModalFactory.invoke('manage-risk-rating-categories', {
        initialState: {
          ratingSubtype: this.ratingDef.categories,
          parent: null,
          category_level: 1,
          rating_scheme: this.selectedType,
          category_type: 'Category',
          ratingList: this.ratingList,
          parentCallback: () => {
            this.fetchRatingSubTypes(this.selectedType);
          },
        },
        class: 'modal-xl',
      });
    }
  }

  openAddSubCategoryModal() {
    if (
      this.selectedType &&
      this.selectedCategory &&
      !this.selectedType.is_system
    ) {
      this.NewModalFactory.invoke('manage-risk-rating-categories', {
        initialState: {
          ratingSubtype: this.ratingDef.subcategories,
          parent: this.selectedCategory,
          category_level: 2,
          rating_scheme: this.selectedType,
          category_type: 'Subcategory',
          ratingList: this.ratingList,
          parentCallback: () => {
            this.fetchRatingSubTypes(this.selectedType);
          },
        },
        class: 'modal-xl',
      });
    }
  }

  openAddRatingsModal() {
    if (
      this.selectedType &&
      this.selectedSubCategory &&
      !this.selectedType.is_system &&
      this.selectedType.rating_level?.toLowerCase() !== 'section'
    ) {
      this.NewModalFactory.invoke('manage-risk-rating-categories', {
        initialState: {
          ratingSubtype: this.ratingDef.ratings,
          parent: this.selectedSubCategory,
          category_level: 3,
          rating_scheme: this.selectedType,
          category_type: 'Rating',
          ratingList: this.ratingList,
        },
        class: 'modal-xl',
      });
    }
  }

  openEditScaleModal(
    category: { rating_scale_id: any },
    selectedRating: any,
    index: any
  ) {
    this.RatingService.manageRatingScaleSub.subscribe((id) => {
      category.rating_scale_id = id;
    });
    this.NewModalFactory.invoke('manage-rating-scale', {
      initialState: {
        category,
        selectedRating,
      },
      class: 'modal-xl',
    });
  }

  ngOnDestroy(): void {
    this.ratingSchemeSub.unsubscribe();
    this.ratingSub.unsubscribe();
  }
}