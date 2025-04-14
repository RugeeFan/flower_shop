
import { addMoreItemList } from "~/data/homepage";
import formatCurrency from "~/utils/formatCurrency";

export default function AddMoreItem() {
  return <div className="grid grid-cols-4 gap-2">
    {
      addMoreItemList.map(item => {
        return <div key={item.title} className="rounded-lg overflow-hidden cursor-pointer border border-grey-400 ">
          <div className="pb-1" >
            <img src={item.imgUrl} alt="" />
          </div>
          <div className="text-[0.65rem] flex justify-center items-center">{item.title}</div>
          <div className="text-[0.65rem] flex justify-center items-center"> {formatCurrency(item.price)}
          </div>
        </div>
      })
    }
    <div className="flex justify-center items-center ">
      <div className="cursor-pointer">
        <i className="ri-add-circle-line text-5xl flex justify-center"></i>
        <div className="underline font-bold text-sm ">VIEW MORE</div>
      </div>
    </div>
  </div>;
}
